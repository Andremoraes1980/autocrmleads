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
      novaEtapa = "negociacao";
      precisaAtualizar = true;
      descricaoEvento = "Usuário respondeu: movido para Em Negociação";
    } else if (lead.etapa === "negociacao" && direcao === "entrada") {
      novaEtapa = "nao_respondido";
      precisaAtualizar = true;
      descricaoEvento = "Cliente respondeu: movido para Não Respondidos ";
    } else if (lead.etapa === "negociacao" && direcao === "saida") {
      // Permanece em negociação
      descricaoEvento = "Usuário respondeu: permanece Em Negociação";
    }

    // Atualiza etapa do lead se necessário
    if (precisaAtualizar && novaEtapa !== lead.etapa) {
      console.log(`[LOG] Atualizando lead_id ${lead_id}: etapa será "${novaEtapa}" (antes era "${lead.etapa}")`);

      await supabase
        .from('leads')
        .update({ etapa: novaEtapa })
        .eq('id', lead_id);
    }

    // Sempre registra no timelin
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

// --- Rota: Listar automações (por revenda) ---
app.get('/api/automacoes', async (req, res) => {
  const { revenda_id } = req.query;
  if (!revenda_id) return res.status(400).json({ error: "revenda_id obrigatório" });

  const { data, error } = await supabase
    .from('automacoes_leads')
    .select('*')
    .eq('revenda_id', revenda_id)
    .order('criado_em', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// --- Rota: Criar nova automação ---
app.post('/api/automacoes', async (req, res) => {
  console.log("Recebido POST /api/automacoes:", req.body); // <-- log do que chegou
  const { nome, status_coluna, ativa, canais, template_id, revenda_id } = req.body;
  if (!nome || !status_coluna || !revenda_id) {
    return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
  }

  const { data, error } = await supabase
    .from('automacoes_leads')
    .insert([
      { nome, status_coluna, ativa, canais, template_id, revenda_id }
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// Salva nova mensagem automática
app.post('/api/automacoes-mensagens', async (req, res) => {
  const {
    texto,
    template_id,
    canais,
    horario,
    ativa,
    ordem,
    automacao_id,
    // outros campos opcionais
  } = req.body;

  // Log para depuração
  console.log("Recebendo nova mensagem automática:", req.body);

  // Insere no Supabase
  const { data, error } = await supabase
    .from('automacoes_mensagens')
    .insert([
      {
        texto,
        template_id,
        canais,
        horario,
        ativa,
        ordem,
        automacao_id,
        // outros campos opcionais
      }
    ])
    .select(); // Para retornar o objeto salvo

  if (error) {
    console.error("Erro ao salvar mensagem automática:", error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data[0]);
});

// GET: Listar mensagens automáticas por automacao_id
app.get('/api/automacoes-mensagens', async (req, res) => {
  const { automacao_id } = req.query;
  if (!automacao_id) return res.status(400).json({ error: "automacao_id obrigatório" });

  const { data, error } = await supabase
    .from('automacoes_mensagens')
    .select('*')
    .eq('automacao_id', automacao_id)
    .order('ordem', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});


app.get('/api/templates', async (req, res) => {
  try {
    let query = supabase.from('templates').select('*');
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar templates:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error("Erro inesperado ao buscar templates:", err);
    res.status(500).json({ error: 'Erro inesperado no backend.' });
  }
});

// ROTA: Criar novo template
app.post('/api/templates', async (req, res) => {
  const { nome, conteudo, status } = req.body;
  if (!nome || !conteudo) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, conteudo" });
  }
  const { data, error } = await supabase
    .from('templates')
    .insert([
      {
        nome,
        conteudo,
        status: status || "pendente",
        // Os campos criado_em/atualizado_em já são preenchidos pelo default do banco!
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});


app.delete('/api/automacoes-mensagens/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('automacoes_mensagens').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Exemplo com Express.js

// --- Rota: Editar mensagem automática ---
app.put('/api/automacoes-mensagens/:id', async (req, res) => {
  const { id } = req.params;
  const {
    texto,
    template_id,
    canais,
    horario,
    ativa,
    ordem,
    automacao_id,
    // outros campos opcionais, se houver
  } = req.body;

  // Log para depuração
  console.log("Editando mensagem automática:", req.body);

  // Atualiza no Supabase
  const { data, error } = await supabase
    .from('automacoes_mensagens')
    .update({
      texto,
      template_id,
      canais,
      horario,
      ativa,
      ordem,
      automacao_id,
      atualizado_em: new Date().toISOString(),
      // outros campos, se houver
    })
    .eq('id', id)
    .single();

  if (error) {
    console.error("Erro ao editar mensagem automática:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});









// Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
