// backend/config/supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY; // ⚠️ backend only!


if (!SUPABASE_URL)  console.error('❌ SUPABASE_URL não configurada');
console.log('🔎 [Supabase] SERVICE ROLE presente?', SERVICE_ROLE ? 'SIM' : 'NÃO');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

if (SERVICE_ROLE) console.log('🔐 [Supabase] Service Role habilitada no backend.');

module.exports = supabase;
