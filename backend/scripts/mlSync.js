// scripts/mlSync.js
const { createClient } = require('@supabase/supabase-js');
const axios = require("axios");
const cron = require("node-cron");

// Configuração Supabase
const supabase = createClient('https://dpanpvimjgybiyjnuyzi.supabase.co', 'SUA_SERVICE_ROLE_KEY_AQUI');

// Função que importa os leads de UMA integração
async function importarLeadsML(integracaoML) {
  const { revenda_id, access_token, user_id_ml } = integracaoML;

  if (!access_token || !user_id_ml || !revenda_id) {
    console.log("⚠️ Integração incompleta. Pulando.");
    return;
  }

  console.log("🔄 Importando para revenda_id:", revenda_id, "| user_id_ml:", user_id_ml);

  let mlData = [];
  try {
    const url = `https://api.mercadolibre.com/classifieds/leads?seller_id=${user_id_ml}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    mlData = res.data.results || [];
  } catch (e) {
    console.error("Erro ao buscar leads do Mercado Livre", e.response?.data || e.message);
    return;
  }

  if (!mlData.length) {
    console.log("ℹ️ Nenhum lead novo encontrado para revenda:", revenda_id);
    return;
  }

  for (const leadML of mlData) {
    const nome =
      (leadML.buyer?.first_name || "") + " " + (leadML.buyer?.last_name || "");
    const telefone = leadML.buyer?.phone?.number || "";
    const veiculo = leadML.vehicle_title || leadML.title || "";
    const email = leadML.buyer?.email || "";
    const id_externo = leadML.id?.toString() || "";
    const data_chegada = leadML.created_at || new Date().toISOString();

    // 👇 SALVA O revenda_id JUNTO!
    const { error: upErr } = await supabase.from("leads").upsert(
      [
        {
          id_externo,
          origem: "mercadolivre",
          nome,
          telefone,
          email,
          veiculo,
          etapa: "Nova Proposta",
          vendedor_id: null,
          data_chegada,
          revenda_id, // <-- aqui está o segredo!
        },
      ],
      { onConflict: ["id_externo", "origem"] }
    );

    if (upErr) {
      console.error("❌ Erro ao inserir lead", id_externo, upErr);
    }
  }

  console.log("✅ Leads importados com sucesso para revenda", revenda_id, ":", mlData.length);
}

// Função para sincronizar todas as integrações ativas
async function syncTodasRevendas() {
  const { data: integracoes, error } = await supabase
    .from("integracoes_ml")
    .select("revenda_id,access_token,user_id_ml")
    .neq('access_token', null);

  if (error) {
    console.error("Erro ao buscar integrações:", error);
    return;
  }

  if (!integracoes?.length) {
    console.log("⚠️ Nenhuma integração ativa encontrada.");
    return;
  }

  for (const integracao of integracoes) {
    await importarLeadsML(integracao);
  }
}

// Agendar para rodar a cada 2 minutos
cron.schedule("*/2 * * * *", syncTodasRevendas);

console.log('🔄 Agendador de sincronização Mercado Livre iniciado!');

// Rode uma vez ao iniciar
syncTodasRevendas();
