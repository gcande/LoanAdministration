// Headers CORS compartidos para todas las Edge Functions.
// En producción, restringe `Access-Control-Allow-Origin` al dominio real de la app.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Envuelve un handler para responder OPTIONS (preflight) automáticamente.
 * Uso:
 *   Deno.serve((req) => withCors(req, () => handle(req)));
 */
export function withCors(
  req: Request,
  handler: (req: Request) => Promise<Response> | Response,
): Promise<Response> | Response {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return handler(req);
}