/* ============================================================
   Vizio Motors — configuração do backend
   Backend: Supabase vizio-core (tabelas mt_*, isoladas por RLS).
   Provisionado em 2026-07-03. Deixe em branco para modo demo.
   ============================================================ */
window.SB_URL   = "https://emyjzjadmxgbtmxnzazu.supabase.co";
window.SB_KEY   = "sb_publishable_PY2YDxUzGgaXRVtvCcasBA_Ml7YUBTC";
window.SB_ORG   = "a1a1a1a1-0000-4000-8000-000000000001"; // org demo (VIZIO)
/* SB_EMAIL vazio de propósito: o login usa o e-mail DIGITADO.
   Antes estava fixo em "isaacmaster@vizio.local" — conta de piloto que foi banida
   (banned_until 2999-12-31, igual à isaac@costureira.local do Ateliê). Com o e-mail
   fixo no código, TODA tentativa de login mirava aquela conta e batia em
   "User is banned", independentemente de quem estivesse tentando entrar.
   Num SaaS multi-tenant com RBAC, credencial compartilhada em código é anti-padrão:
   o rbacCan() depende do e-mail da sessão para saber quem é quem. */
window.SB_EMAIL = "";
