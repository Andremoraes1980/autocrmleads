// autocrm-backend/middlewares/requireAuth.js
const { supabaseAnon } = require('../config/supabaseAnon.js');

/**
 * Middleware de autenticação com diagnósticos claros:
 * - 401: sem token / token inválido
 * - 500: erro ao carregar perfil
 * - 403 + {error:"profile_not_found"}: não achou linha em public.usuarios (provável RLS/política faltando)
 * - 403 + {error:"not_admin"}: encontrou perfil, mas não é admin
 */
function requireAuth({ requireAdmin = true } = {}) {
  return async function (req, res, next) {
    try {
      const authHeader = req.headers.authorization || '';
      const parts = authHeader.split(' ');
      const token = parts.length === 2 ? parts[1] : null;

      if (!token) {
        return res.status(401).json({ error: 'missing_token' });
      }

      // Valida token e obtém user
      const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);
      if (userErr || !userData?.user) {
        return res.status(401).json({ error: 'invalid_or_expired_token' });
      }

      const userId = userData.user.id;
      const email = userData.user.email || null;

      // Tenta ler o perfil na tabela `usuarios` usando o token do próprio usuário (RLS aplicando aqui)
      const { data: perfil, error: perfilErr } = await supabaseAnon
        .from('usuarios')
        .select('revenda_id, tipo')
        .eq('id', userId)
        .maybeSingle();

      if (perfilErr) {
        console.error('[requireAuth] perfilErr:', perfilErr);
        return res.status(500).json({ error: 'profile_query_failed', message: perfilErr.message });
      }

      // Se não encontrou linha, é diferente de "não admin".
      if (!perfil) {
        console.warn('[requireAuth] profile_not_found para userId:', userId);
        return res.status(403).json({
          error: 'profile_not_found',
          userId,
          hint: 'Crie a linha em public.usuarios para este id OU ajuste a policy SELECT (id = auth.uid()).'
        });
      }

      const revenda_id = perfil?.revenda_id ?? null;
      const tipo = (perfil?.tipo || '').toLowerCase();

      if (requireAdmin && tipo !== 'admin') {
        console.warn('[requireAuth] not_admin:', { userId, tipo });
        return res.status(403).json({ error: 'not_admin', tipo });
      }

      req.auth = { userId, email, revenda_id, tipo };
      return next();
    } catch (err) {
      console.error('[requireAuth] unexpected_error:', err);
      return res.status(500).json({ error: 'internal_auth_middleware_error' });
    }
  };
}

module.exports = { requireAuth };
