// Arquivo: backend/services/buscarLeadIdPorTelefone.js

const supabase = require('../config/supabase');

async function buscarLeadIdPorTelefone(telefone) {
  // Formata o telefone para conter apenas dígitos
  const tel = telefone.replace(/\D/g, "");

  const { data, error } = await supabase
    .from('leads')
    .select('id')
    .ilike('telefone', `%${tel}%`) // Usa ilike para buscar parcialmente
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

module.exports = buscarLeadIdPorTelefone;
