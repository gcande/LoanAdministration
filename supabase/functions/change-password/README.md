# Edge Function: `change-password`

Permite a un **admin** cambiar la contraseña de cualquier usuario usando `service_role`.
La clave `service_role` **nunca** debe estar en el frontend — solo vive en esta función.

---

## 🔐 Flujo de seguridad

1. El cliente envía `POST /functions/v1/change-password` con `Authorization: Bearer <jwt-del-admin>`.
2. La función valida el JWT y consulta `perfiles.rol` con `service_role`.
3. Si el caller **no es admin** → `403 forbidden`.
4. Si pasa las validaciones, llama a `auth.admin.updateUserById` con `service_role`.

---

## 📡 Request

```http
POST https://<project-ref>.supabase.co/functions/v1/change-password
Content-Type: application/json
Authorization: Bearer <jwt-del-admin>

{
  "userId": "uuid-del-usuario-objetivo",
  "newPassword": "nueva-clave-segura-123"
}
```

## ✅ Respuestas

| Status | Body                                  | Significado                              |
|--------|---------------------------------------|------------------------------------------|
| 200    | `{ "ok": true }`                      | Contraseña actualizada                   |
| 400    | `{ "error": "invalid_user_id" }`      | `userId` no es UUID                      |
| 400    | `{ "error": "weak_password" }`        | < 8 caracteres                           |
| 400    | `{ "error": "self_change_forbidden" }`| Admin intenta cambiarse a sí mismo       |
| 401    | `{ "error": "unauthenticated" }`      | JWT inválido o ausente                   |
| 403    | `{ "error": "forbidden" }`            | Caller no es admin                       |
| 404    | `{ "error": "user_not_found" }`       | Usuario objetivo no existe               |
| 500    | `{ "error": "server_misconfigured" }` | Falta env var                           |
| 500    | `{ "error": "update_failed" }`        | Error interno al actualizar              |

---

## 🚀 Despliegue

### Prerrequisitos

```bash
# Instalar CLI de Supabase (https://supabase.com/docs/guides/cli)
npm i -g supabase

# Login
supabase login

# Vincular al proyecto (solo la primera vez)
supabase link --project-ref <tu-project-ref>
```

### Variables de entorno

Supabase **auto-inyecta** estas vars en cada Edge Function en runtime — **no necesitas setear nada**:

| Variable | Fuente |
|---|---|
| `SUPABASE_URL` | Auto-inyectada por la plataforma |
| `SUPABASE_ANON_KEY` | Auto-inyectada por la plataforma |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-inyectada por la plataforma |

> ⚠️ Los nombres con prefijo `SUPABASE_` o `DENO_` están reservados.
> Si intentas `supabase secrets set SUPABASE_…`, la CLI devuelve:
> `Env name cannot start with SUPABASE_, skipping`.
> **No hace falta**: ya están disponibles vía `Deno.env.get(...)`.

### Deploy

```bash
supabase functions deploy change-password --no-verify-jwt
```

> `--no-verify-jwt` se usa porque **la función valida el JWT internamente** contra la tabla `perfiles` (necesita el rol del usuario).

---

## 🧪 Probar localmente

```bash
# Levantar funciones en local (requiere Docker)
supabase functions serve change-password --no-verify-jwt --env-file ./supabase/.env.local

# En otra terminal, con un JWT real de tu admin:
curl -X POST http://localhost:54321/functions/v1/change-password \
  -H "Authorization: Bearer <jwt-admin>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<uuid-objetivo>","newPassword":"nueva-clave-segura-123"}'
```

---

## 🔗 Integración con el frontend

La función `cambiarPasswordUsuario` en `src/services/perfiles.ts` ya la invoca:

```ts
const { data, error } = await supabase.functions.invoke('change-password', {
  body: { userId, newPassword },
});
```

El cliente de Supabase añade automáticamente:
- `Authorization: Bearer <sesion-jwt>` (el del admin logueado).
- `apikey: <anon-key>`.

---

## 🛡️ Por qué service_role aquí y no en el frontend

| Enfoque | Riesgo |
|---|---|
| `service_role` en frontend | Cualquiera puede saltarse RLS y borrar/editar toda la BD |
| Edge Function con `service_role` | Solo el admin puede llegar al código; el secreto nunca sale del entorno Supabase |

**Regla de oro**: `service_role` solo en Edge Functions / migrations, **nunca** en código de cliente.