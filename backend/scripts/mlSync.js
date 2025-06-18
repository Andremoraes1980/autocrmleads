console.log("🟢 mlSync.js iniciado!");
// scripts/mlSync.js
const { createClient } = require('@supabase/supabase-js');
const axios = require("axios");
const cron = require("node-cron");

// Configuração Supabase
const supabase = createClient('https://dpanpvimjgybiyjnuyzi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwYW5wdmltamd5Yml5am51eXppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY4NjEzNSwiZXhwIjoyMDYwMjYyMTM1fQ.BNz557c9oAMIgcCfrCl4wYaq3KlNzDPtt8odh0b83C4');

// Função que importa os leads de UMA integração
async function importarLeadsML(integracaoML) {
  // LOG para ver o objeto completo recebido!
  console.log("🔍 importacao - Objeto recebido:", JSON.stringify(integracaoML, null, 2));

  const { revenda_id, access_token, user_id_ml } = integracaoML;

  // LOG para ver valores individuais
  console.log("🔎 Campos extraídos:", { revenda_id, access_token, user_id_ml });

  if (!access_token || !user_id_ml || !revenda_id) {
    console.log("⚠️ Integração incompleta. Pulando.");
    return;
  }

  console.log("🔄 Importando para revenda_id:", revenda_id, "| user_id_ml:", user_id_ml);

  let mlData = [];
  try {
    console.log("➡️ Fazendo requisição para Mercado Livre:", {
      seller_id: user_id_ml,
      url: `https://api.mercadolibre.com/classifieds/leads?seller_id=${user_id_ml}`,
      revenda_id,
      tokenInicio: access_token.substring(0, 10) // só para debug, não expõe tudo
    });
    const url = `https://api.mercadolibre.com/classifieds/leads?seller_id=${user_id_ml}`;
    let res;
    try {
      res = await axios.get(url, { headers: { Authorization: `Bearer ${access_token}` } });
    } catch (e) {
      // Se o erro for por token expirado, tenta renovar!
      if (e.response?.status === 401 && integracaoML.refresh_token) {
        console.warn("🔁 Token expirado, tentando renovar via refresh_token...");
        // Troque pelos valores do seu app:
        const client_id = process.env.ML_CLIENT_ID;
const client_secret = process.env.ML_CLIENT_SECRET;

        const novoToken = await renovarAccessToken(integracaoML.refresh_token, client_id, client_secret);
        if (novoToken && novoToken.access_token) {
          // Atualize os tokens no Supabase:
          await supabase
            .from('integracoes_ml')
            .update({
              access_token: novoToken.access_token,
              refresh_token: novoToken.refresh_token
            })
            .eq('revenda_id', revenda_id);

          // Tente novamente com o novo access_token:
          res = await axios.get(url, { headers: { Authorization: `Bearer ${novoToken.access_token}` } });
        } else {
          console.error("❌ Não foi possível renovar o access_token. Verifique os dados.");
          return;
        }
      } else {
        console.error("Erro ao buscar leads do Mercado Livre", e.response?.data || e.message);
        return;
      }
    }
    console.log("⬅️ Resposta Mercado Livre:", {
      status: res.status,
      total: res.data?.results?.length,
      exemplo: res.data?.results?.[0] || "Nenhum lead"
    });
    mlData = res.data.results || [];
  } catch (e) {
    console.error("Erro inesperado ao buscar leads do Mercado Livre", e.response?.data || e.message);
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
    console.log("📝 Salvando lead:", {
      id_externo, nome, veiculo, revenda_id
    });
    
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

// --- RENOVAÇÃO AUTOMÁTICA DE TOKEN ---
async function renovarAccessToken(refresh_token, client_id, client_secret) {
  try {
    const url = "https://api.mercadolibre.com/oauth/token";
    const res = await axios.post(url, {
      grant_type: "refresh_token",
      client_id,
      client_secret,
      refresh_token,
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log("✅ Novo token gerado pelo refresh_token!", res.data);
    return res.data; // { access_token, refresh_token, expires_in, ... }
  } catch (err) {
    console.error("❌ Erro ao renovar access_token:", err.response?.data || err.message);
    return null;
  }
}


// Função para sincronizar todas as integrações ativas
async function syncTodasRevendas() {
  const { data: integracoes, error } = await supabase
    .from("integracoes_ml")
    .select("revenda_id,access_token,refresh_token,user_id_ml")

    
    .neq('access_token', null);

  if (error) {
    console.error("Erro ao buscar integrações:", error);
    return;
  }

  console.log("🟢 Dados brutos recebidos do Supabase:", integracoes);

if (!integracoes || !integracoes.length) {
  console.log("⚠️ Nenhuma integração retornada do Supabase.");
  return;
} else {
  console.log("👍 Vai entrar no loop, total:", integracoes.length);
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
