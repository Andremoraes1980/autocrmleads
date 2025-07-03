// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// === ADICIONADO: Supabase Client para salvar leads Webmotors ===
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role para inserção backend
);

const app = express();

// Middleware para aceitar JSON
app.use(express.json()); // <- MOVIDO PARA O TOPO

// Habilita CORS apenas para seus domínios de produção
app.use(cors({
  origin: [
    "https://autocrmleads.vercel.app",
    "https://autocrmleads.com.br",
    "https://www.autocrmleads.com.br",
    "http://localhost:5173" // remove depois se não for usar local
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
console.log("✅ CORS configurado para Vercel, domínio com e sem www e local dev");

// Log origem da requisição
app.use((req, res, next) => {
  console.log("🌎 Origem da requisição:", req.headers.origin);
  next();
});

// Webhook Mercado Livre
app.post('/api/ml-webhook', (req, res) => {
  console.log("🔔 Webhook recebido do Mercado Livre:", req.body);
  res.sendStatus(200);
});



// === AJUSTADO: Webmotors Leads - salva no Supabase ===
app.post('/api/webmotors-leads', async (req, res) => {
  console.log("🚗 Lead recebido da Webmotors:", req.body);

  const insertRow = {
    origem: 'webmotors',
    recebido_em: new Date().toISOString(),
    dados: req.body, // campo tipo jsonb no Supabase
  };

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([insertRow]);

    if (error) {
      console.error("❌ Erro ao salvar lead Webmotors no Supabase:", error);
    } else {
      console.log("✅ Lead Webmotors salvo no Supabase:", data);

      // === ATUALIZA O STATUS DA REVENDA PARA 'conectado' ===
      // Tente pegar o revenda_id do payload do lead, ajuste conforme sua estrutura!
      const revenda_id =
        req.body.revenda_id ||
        req.body.cnpj ||
        null; // tente outros campos que identifiquem a loja

      if (revenda_id) {
        await supabase
          .from("revenda")
          .update({ webmotors_status: "conectado" })
          .eq("id", revenda_id);
        console.log(`🔗 Revenda ${revenda_id} conectada com Webmotors!`);
      } else {
        console.log("ℹ️ Não foi possível atualizar status: revenda_id não encontrado no payload.");
      }
    }
  } catch (err) {
    console.error("❌ Erro inesperado ao salvar lead Webmotors:", err);
  }

  res.sendStatus(200);
});


// (opcional) Webmotors estoque
app.post('/api/webmotors-estoque', (req, res) => {
  console.log("🗂️ Estoque recebido da Webmotors:", req.body);
  res.sendStatus(200);
});

// Rota de teste
app.get('/ping', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
console.log("🔎 Rota GET /ping pronta para teste externo");

// Rota de autenticação com Mercado Livre
app.post('/api/ml-auth', async (req, res) => {
  const { code } = req.body;

  console.log("🔑 Recebido code do Mercado Livre:", code);

  try {
    const result = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        code,
        redirect_uri: process.env.ML_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    console.log("✅ Token recebido do ML:", result.data);
    return res.json(result.data);

  } catch (err) {
    console.error("❌ Erro ao trocar code por token:", err?.response?.data || err.message);
    return res.status(500).json({ message: "Erro ao autenticar com Mercado Livre." });
  }
});

// === NOVA ROTA: Automação de status de leads ===

app.post('/api/evento-mensagem', async (req, res) => {
  // No início da rota /api/evento-mensagem:
console.log("🔥 Evento de mensagem recebido:", req.body);

  try {
    const { lead_id, tipo, direcao, usuario_id, conteudo } = req.body;
    // tipo: "texto", "audio", "imagem", etc.
    // direcao: "entrada" (cliente) | "saida" (usuário do sistema)
    // usuario_id: quem enviou (pode ser null se cliente)
    // conteudo: texto da mensagem (opcional)
    if (!lead_id || !tipo || !direcao) {
      return res.status(400).json({ error: 'lead_id, tipo e direcao são obrigatórios' });
    }

    // Busca o lead atual
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Determina próxima etapa conforme regras do funil
    let novaEtapa = lead.etapa;
    let precisaAtualizar = false;
    let descricaoEvento = "";

    if (lead.etapa === "nova_proposta" && direcao === "saida") {
      novaEtapa = "sem_contato";
      precisaAtualizar = true;
      descricaoEvento = "Mensagem enviada (auto ou manual): movido para Sem Contato";
    } else if (lead.etapa === "sem_contato" && direcao === "entrada") {
      novaEtapa = "nao_respondido";
      precisaAtualizar = true;
      descricaoEvento = "Cliente respondeu: movido para Não Respondidos ";
    } else if (lead.etapa === "nao_respondido" && direcao === "saida") {
      novaEtapa = "em_negociacao";
      precisaAtualizar = true;
      descricaoEvento = "Usuário respondeu: movido para Em Negociação";
    } else if (lead.etapa === "em_negociacao" && direcao === "entrada") {
      novaEtapa = "nao_respondido";
      precisaAtualizar = true;
      descricaoEvento = "Cliente respondeu: movido para Não Respondidos ";
    } else if (lead.etapa === "em_negociacao" && direcao === "saida") {
      // Permanece em negociação
      descricaoEvento = "Usuário respondeu: permanece Em Negociação";
    }

    // Atualiza etapa do lead se necessário
    if (precisaAtualizar && novaEtapa !== lead.etapa) {
      await supabase
        .from('leads')
        .update({ etapa: novaEtapa })
        .eq('id', lead_id);
    }

    // Sempre registra no timeline
    const eventoTimeline = {
      lead_id,
      tipo: "etapa_automatica",
      usuario_id: usuario_id || null,
      criado_em: new Date().toISOString(),
      conteudo: descricaoEvento || "Evento de mensagem",
      etapa_nova: novaEtapa,
      etapa_anterior: lead.etapa,
      texto_mensagem: conteudo || "",
    };

    await supabase.from('timeline').insert([eventoTimeline]);

    return res.json({ status: "ok", novaEtapa, timeline: eventoTimeline });
  } catch (err) {
    console.error("Erro no endpoint /api/evento-mensagem:", err);
    return res.status(500).json({ error: err.message });
  }
});


// Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
