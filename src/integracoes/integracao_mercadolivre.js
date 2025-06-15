import { supabase } from "../lib/supabaseClient";
import axios from "axios";
import { log, error } from "../utils/Logger";
import { toast } from "react-toastify";



/**
 * Importa os leads do Mercado Livre para a tabela 'leads'
 * @param {string} revenda_id - id da revenda atual
 */
export async function importarLeadsML(revenda_id) {
  // 1) Buscar integração no Supabase, pegando access_token e user_id_ml
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
  log("Token ML", access_token);
  log("Seller ID", user_id_ml);

  // 2) Chamar o endpoint de leads para este seller
  let mlData = [];
  try {
    // Exemplo de URL: /classifieds/leads?seller_id=<sellerId>
    const url = `https://api.mercadolibre.com/classifieds/leads?seller_id=${user_id_ml}`;
    log("➡️ GET Mercado Livre", url);
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("⬅️ Status", res.status);
    log("📦 Dados brutos ML", res.data);
    // Normalmente vem em res.data.results
    mlData = res.data.results || [];
  } catch (e) {
    toast.error("Erro ao buscar leads do Mercado Livre");
    return;
  }

  if (!mlData.length) {
    console.log("ℹ️ Nenhum lead novo encontrado.");
    return;
  }

  // 3) Inserir/atualizar cada lead no Supabase
  for (const leadML of mlData) {
    const nome =
      (leadML.buyer?.first_name || "") + " " + (leadML.buyer?.last_name || "");
    const telefone = leadML.buyer?.phone?.number || "";
    const veiculo = leadML.vehicle_title || leadML.title || "";
    const email = leadML.buyer?.email || "";
    const id_externo = leadML.id?.toString() || "";
    const data_chegada = leadML.created_at || new Date().toISOString();

    console.log("↪️ Upsert lead:", { id_externo, nome, telefone, veiculo });

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
