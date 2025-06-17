// scripts/mlSync.js
const { createClient } = require('@supabase/supabase-js');
const axios = require("axios");
const cron = require("node-cron");

// Configuração Supabase
const supabase = createClient('https://dpanpvimjgybiyjnuyzi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwYW5wdmltamd5Yml5am51eXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODYxMzUsImV4cCI6MjA2MDI2MjEzNX0.r0YdAO3ZNiM1uzHIatTnAHwvaDbGV1EhIt8Vffo4-38');

// Função que importa leads igual ao seu frontend, mas rodando no backend!
async function importarLeadsML(revenda_id) {
  const { data: integracaoML, error: errML } = await supabase
    .from("integracoes_ml")
    .select("access_token,user_id_ml")
    .eq("revenda_id", revenda_id)
    .single();

  if (errML || !integracaoML) {
    console.log("⚠️ Integração não encontrada. Saindo sem puxar leads.");
    return;
  }

  const { access_token, user_id_ml } = integracaoML;
  let mlData = [];
  try {
    const url = `https://api.mercadolibre.com/classifieds/leads?seller_id=${user_id_ml}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    mlData = res.data.results || [];
  } catch (e) {
    console.error("Erro ao buscar leads do Mercado Livre", e.message);
    return;
  }

  if (!mlData.length) {
    console.log("ℹ️ Nenhum lead novo encontrado.");
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
        },
      ],
      { onConflict: ["id_externo", "origem"] }
    );

    if (upErr) {
      console.error("❌ Erro ao inserir lead", id_externo, upErr);
    }
  }

  console.log("✅ Leads importados com sucesso:", mlData.length);
}

// Função para sincronizar todas as revendas ativas
async function syncTodasRevendas() {
  const { data: revendas, error } = await supabase
    .from("integracoes_ml")
    .select("revenda_id")
    .neq('access_token', null); // só revendas com integração

  if (error) {
    console.error("Erro ao buscar revendas:", error);
    return;
  }

  for (const r of revendas) {
    await importarLeadsML(r.revenda_id);
  }
}

// Agendar para rodar a cada 2 minutos
cron.schedule("*/2 * * * *", syncTodasRevendas);

console.log('🔄 Agendador de sincronização Mercado Livre iniciado!');

// Rode uma vez ao iniciar
syncTodasRevendas();
