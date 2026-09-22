// Edge Function: change-password
//
// Cambia la contraseña de un usuario (auth.users) usando service_role.
// Solo los administradores pueden invocarla.
//
// POST { userId: string, newPassword: string }
// Headers: Authorization: Bearer <jwt-del-admin>
//
// Response:
//   200 { ok: true }
//   400 { error: '...' }       // payload inválido o password débil
//   401 { error: 'unauthenticated' }
//   403 { error: 'forbidden' }  // el caller no es admin
//   404 { error: 'user_not_found' }
//   500 { error: '...' }

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MIN_PASSWORD_LENGTH = 8;

interface ChangePasswordPayload {
  userId?: unknown;
  newPassword?: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  // 1) Variables de entorno (auto-inyectadas por Supabase en cada Edge Function)
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[change-password] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  // 2) JWT del caller (admin)
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) {
    return jsonResponse({ error: 'unauthenticated' }, 401);
  }

  // Cliente con JWT del caller para verificar identidad y rol
  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerErr } = await callerClient.auth.getUser(jwt);
  if (callerErr || !callerData?.user) {
    return jsonResponse({ error: 'unauthenticated' }, 401);
  }
  const callerId = callerData.user.id;

  // Cliente con service_role para lecturas/escrituras elevadas
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3) Verificar que el caller es admin
  const { data: perfil, error: perfilErr } = await adminClient
    .from('perfiles')
    .select('rol, deleted_at')
    .eq('id', callerId)
    .is('deleted_at', null)
    .single();

  if (perfilErr || !perfil) {
    return jsonResponse({ error: 'forbidden' }, 403);
  }
  if (perfil.rol !== 'admin') {
    return jsonResponse({ error: 'forbidden' }, 403);
  }

  // 4) Validar payload
  let body: ChangePasswordPayload;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!userId || !isValidUuid(userId)) {
    return jsonResponse({ error: 'invalid_user_id' }, 400);
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return jsonResponse(
      { error: 'weak_password', message: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres` },
      400,
    );
  }
  if (userId === callerId) {
    return jsonResponse(
      { error: 'self_change_forbidden', message: 'Usa la app para cambiar tu propia contraseña' },
      400,
    );
  }

  // 5) Verificar que el usuario objetivo existe
  const { data: target, error: targetErr } = await adminClient.auth.admin.getUserById(userId);
  if (targetErr || !target?.user) {
    return jsonResponse({ error: 'user_not_found' }, 404);
  }

  // 6) Actualizar contraseña
  const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateErr) {
    console.error('[change-password] updateUserById error:', updateErr);
    return jsonResponse({ error: 'update_failed', detail: updateErr.message }, 500);
  }

  return jsonResponse({ ok: true });
});