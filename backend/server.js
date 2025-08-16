// backend/server.js

require('dotenv').config();

// === ADICIONADO: Supabase Client para salvar leads Webmotors ===
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role para inserção backend
);

console.log('🔍 PROVIDER_SOCKET_URL =', process.env.PROVIDER_SOCKET_URL);
require('./jobs/agendador');
const axios = require('axios');
const { converterWebmParaOgg } = require('./services/converterWebmParaOgg');
const cors = require('cors');
const { io: ioClient } = require('socket.io-client');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const QRCode = require('qrcode');
const createSocketServer = require('./connections/socketServer');
const buscarLeadIdPorTelefone = require('./services/buscarLeadIdPorTelefone'); //aqui
/** ====== ATIVAR V2 E DESATIVAR ANTIGOS ====== **/
const socketProvider = require('./connections/socketProviderV2');
const receberMensagem = require('./listeners/provider/receberMensagem');
const socketFrontend = require('./connections/socketFrontend');
const ultimoQrCodeDataUrlRef = { value: null }; // referência mutável
const receberQrCode = require('./listeners/provider/receberQrCode');
const io = createSocketServer(server);
const entrarNaSala = require('./listeners/frontend/entrarNaSala');
const { converterOggParaMp3 } = require('./services/converterOggParaMp3');
const { randomUUID } = require('crypto'); // sem dependência externa


// helper: normaliza telefone → só dígitos com prefixo 55 (remove @c.us)
const toE164 = (v = '') => {
  let d = String(v).replace(/@c\.us$/, '').replace(/\D/g, '');
  if (!d.startsWith('55')) d = '55' + d;
  return d;
};




// --- BEGIN: listener statusEnvio único ---
const jobIndex = global.__jobIndex || (global.__jobIndex = new Map());

// Handler unificado para status de envio (ACKs)
async function handleStatusEnvio(evt = {}) {
  // DEBUG enxuto
  console.log("🧪[BACK] statusEnvio RX:", JSON.stringify(evt));

  const { jobId, ok, mensagemId, ack, tipo, para } = evt;

  // helper: ack nunca regride (1→2→3→4), exceto erro -1
  const normalizeAck = (prev = 0, next = 0) => {
    const p = Number(prev ?? 0), n = Number(next ?? 0);
    if (n === -1) return -1;
    return Math.max(p, n);
  };

  try {
    // CAMINHO A) envio inicial (veio com jobId do /api/enviar-*)
    if (jobId && jobIndex.has(jobId)) {
      const { mensagemRowId, lead_id } = jobIndex.get(jobId);

      // ✅ mantém seu comportamento atual (ACK1, opcionalmente seta externo se vier)
      const patch = ok
        ? (mensagemId
            ? { ack: 1, mensagem_id_externo: mensagemId }
            : { ack: 1 })
        : { ack: -1 /*, erro_envio: error */ };

      console.log("🧪[BACK] jobId→UPDATE:", { id: mensagemRowId, patch });

      const { data: updRows, error: updErr } = await supabase
        .from('mensagens')
        .update(patch)
        .eq('id', mensagemRowId)
        .select('id, lead_id, mensagem_id_externo, ack')
        .single();

      if (updErr) {
        console.error('❌ jobId UPDATE falhou:', updErr.message);
      } else {
        console.log('🧪[BACK] jobId→UPDATE ok:', updRows);
        // notifica o front (casa por id local)
        io.to(`lead-${lead_id}`).emit('statusEnvio', {
          jobId,
          ok,
          mensagemId,
          mensagemIdLocal: mensagemRowId,
          ack: updRows.ack,
          tipo: tipo || 'texto',
          para
        });
        console.log("🧪[BACK] EMIT (jobId) →", {
          sala: `lead-${lead_id}`,
          idLocal: mensagemRowId,
          ack: updRows.ack
        });
      }

      jobIndex.delete(jobId);
      return;
    }

    // CAMINHO B) ACKs 2/3/4 vindos do provider (message_ack, sem jobId)
    if (mensagemId) {
      console.log("🧪[BACK] ACK por mensagemId:", { mensagemId, ack, para });

      // 1) tenta achar pela mensagem_id_externo (caminho ideal)
      const { data: rows1, error: err1 } = await supabase
        .from('mensagens')
        .select('id, lead_id, ack, mensagem_id_externo')
        .eq('mensagem_id_externo', mensagemId)
        .order('criado_em', { ascending: false })
        .limit(1);

      let alvo = rows1?.[0] || null;

      // 2) fallback: última mensagem de SAÍDA desse telefone ainda SEM id_externo
if (!alvo) {
  const raw = String(para || '');
  const digits = raw.replace(/\D/g, '');
  const digitsNo55 = digits.replace(/^55/, '');
  const candidatos = Array.from(new Set([digits, digitsNo55])).filter(Boolean);

  console.log("🧪[BACK] fallback por telefone_cliente:", { candidatos });

  // Tentativa A — match EXATO (com/sem 55)
  let alvoRow = null;
  let respA = await supabase
    .from('mensagens')
    .select('id, lead_id, ack, mensagem_id_externo, direcao, telefone_cliente, criado_em, criado_em')
    .eq('direcao', 'saida')
    .is('mensagem_id_externo', null)
    .in('telefone_cliente', candidatos)
    .order('criado_em', { ascending: false })
    .limit(1);

  if (respA.error) {
    console.error('❌[BACK] fallback A error:', respA.error);
  } else {
    alvoRow = respA.data?.[0] || null;
  }

  // Tentativa B — formatos variados (telefone com máscara), usa ILIKE
  if (!alvoRow) {
    const pattern1 = `%${digits}%`;
    const pattern2 = `%${digitsNo55}%`;
    console.log("🧪[BACK] fallback ILIKE:", { pattern1, pattern2 });

    const respB = await supabase
      .from('mensagens')
      .select('id, lead_id, ack, mensagem_id_externo, direcao, telefone_cliente, criado_em, criado_em')
      .eq('direcao', 'saida')
      .is('mensagem_id_externo', null)
      .or(`telefone_cliente.ilike.${pattern1},telefone_cliente.ilike.${pattern2}`)
      .order('criado_em', { ascending: false })
      .limit(1);

    if (respB.error) {
      console.error('❌[BACK] fallback B error:', respB.error);
    } else {
      alvoRow = respB.data?.[0] || null;
    }
  }

  if (alvoRow) {
    alvo = alvoRow;
    console.log("🧪[BACK] fallback HIT id:", alvo.id, "tel_banco:", alvo.telefone_cliente);
  } else {
    console.warn("🧪[BACK] NADA CASOU → não achei linha para aplicar ACK");
  }
}



      if (!alvo) {
        console.warn("🧪[BACK] NADA CASOU → não achei linha para aplicar ACK");
        return;
      }

      const novoAck = normalizeAck(alvo.ack, ack);

      // se viemos pelo fallback, **preenche o id externo agora**
      const patch2 = alvo.mensagem_id_externo
        ? { ack: novoAck }
        : { ack: novoAck, mensagem_id_externo: mensagemId };  // ← PONTO-CHAVE 2

      const { data: upd2, error: updErr2 } = await supabase
        .from('mensagens')
        .update(patch2)
        .eq('id', alvo.id)
        .select('id, lead_id, ack, mensagem_id_externo')
        .single();

      if (updErr2) {
        console.error("❌ UPDATE ack falhou:", updErr2.message);
        return;
      }

      console.log("🧪[BACK] UPDATE ack ok:", upd2);

      // notifica o front (casa por id local OU por mensagem_id_externo)
      io.to(`lead-${upd2.lead_id}`).emit('statusEnvio', {
        mensagemIdLocal: upd2.id,
        mensagemId: upd2.mensagem_id_externo || mensagemId,
        ack: upd2.ack,
        tipo: tipo || 'texto',
        para
      });
      console.log("🧪[BACK] EMIT (mensagemId) →", {
        sala: `lead-${upd2.lead_id}`,
        idLocal: upd2.id,
        ack: upd2.ack
      });
      return;
    }

    // Se chegou aqui, não é jobId nem mensagemId válido
    console.warn("🧪[BACK] statusEnvio ignorado (sem jobId/mensagemId).");

  } catch (e) {
    console.error('❌ [statusEnvio] falha ao processar:', e.message);
  }
}

// Fonte A: eventos vindos do provider (socketProvider)
if (!global.__statusEnvioRegistered) {
  socketProvider?.off?.('statusEnvio', handleStatusEnvio); // passa a MESMA função no off
  socketProvider?.on?.('statusEnvio', handleStatusEnvio);
  global.__statusEnvioRegistered = true;
}

// Fonte B: eventos que chegam via socketBackend (provider → backend pelo io)
if (!global.__statusEnvioBridgeRegistered) {
  io.on('connection', (socket) => {
    socket.off?.('statusEnvio', handleStatusEnvio); // idem: off com a mesma ref
    socket.on('statusEnvio', handleStatusEnvio);
  });
  global.__statusEnvioBridgeRegistered = true;
}
// --- END: listener statusEnvio único ---



global.ultimoQrCodeDataUrl = ultimoQrCodeDataUrlRef; // (opcional) caso queira acessar em outros arquivos
socketFrontend(io, socketProvider, ultimoQrCodeDataUrlRef);



io.on('connection', (socket) => {
  console.log('🟢 [IO] Cliente conectado:', socket.id);

  entrarNaSala(socket, io);

  // 🔁 Ponte para ACKs vindos do provider via socketBackend (canal B)
const handleBridgeStatusEnvio = (evt) => {
  try {
    console.log('🔁 [BACK] Bridge statusEnvio (io→socketProvider):', evt);
    // (por enquanto mantém o repasse; no próximo passo vamos direcionar ao handler local)
    socketProvider.emit?.('statusEnvio', evt);
  } catch (e) {
    console.error('💥 [BACK] Bridge statusEnvio erro:', e);
  }
};

socket.off?.('statusEnvio', handleBridgeStatusEnvio); // precisa do listener aqui
socket.on('statusEnvio', handleBridgeStatusEnvio);



  // ⬇️ PROVIDER → BACKEND: recebe o evento que o provider está emitindo
  receberMensagem(socket, io);

  socket.on('disconnect', (reason) => {
    console.log(`🔌 [IO] ${socket.id} desconectou — motivo:`, reason);
  });

});



// Listeners já modularizados corretamente:




//  2.RECEBE QR do PROVIDER (fora do io.on('connection')) ---
// Arquivo: backend/listeners/provider/receberQrCode.js
receberQrCode(socketProvider, io);





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



app.post('/api/enviar-mensagem', async (req, res) => {
  const {
    para,
    mensagem,
    lead_id,
    remetente_id,
    remetente,
    canal,
    tipo,
    telefone_cliente,
    lida,
  } = req.body;

  if (!para || !mensagem || !lead_id || !remetente_id || !remetente) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  try {
    // 1) Buscar dados extras do lead (revenda/vendedor/nome)
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('revenda_id,vendedor_id,telefone,nome')
      .eq('id', lead_id)
      .single();

    if (leadError || !leadData) {
      return res.status(400).json({ error: "Lead não encontrado para extrair revenda/vendedor_id" });
    }

    const revenda_id  = leadData.revenda_id;
    const vendedor_id = leadData.vendedor_id;

    let remetente_nome = null;
    if (remetente_id) {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', remetente_id)
        .single();
      remetente_nome = userData?.nome || null;
    } else {
      remetente_nome = leadData?.nome || leadData?.telefone || 'Cliente';
    }

    const direcao = 'saida'; // envio do painel

    // 2) Criar a linha no Supabase (estado inicial "pendente" — se houver essa coluna)
    const { data: inserted, error: insertError } = await supabase
      .from('mensagens')
      .insert([{
        lead_id,
        revenda_id,
        vendedor_id,
        mensagem,
        criado_em: new Date().toISOString(),
        remetente_id,
        remetente,
        remetente_nome,
        tipo: tipo || 'texto',
        canal: canal || 'WhatsApp Cockpit',
        direcao,
        telefone_cliente: telefone_cliente || null,
        lida: typeof lida === "boolean" ? lida : false,
        // status_envio: 'pendente', // se existir no schema
      }])
      .select('id')
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Erro ao salvar no Supabase: ' + insertError.message });
    }

    const mensagemRowId = inserted.id;
    const jobId = randomUUID();
    jobIndex.set(jobId, { mensagemRowId, lead_id });

    // 3) Emitir para o provider com ACK (callback) — resposta rápida
    console.log('🔌 [BACKEND] socketProvider connected?', socketProvider?.connected, 'id:', socketProvider?.id);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Provider não respondeu em 7s')), 7000);

      socketProvider.emit(
        'enviarMensagem',
        { para, mensagem, jobId },
        (ack) => {
          clearTimeout(timeout);
          if (ack && ack.accepted) {
            resolve(true);
          } else {
            reject(new Error(ack?.error || 'Provider recusou envio'));
          }
        }
      );
    });

    // 4) Responder imediatamente ao front; o resultado final virá por websockets
    return res.json({ status: 'ok', jobId, mensagem_id: mensagemRowId });

  } catch (err) {
    console.error('❌ Erro geral no envio:', err.message);
    return res.status(500).json({ error: err.message });
  }
});


app.post('/api/enviar-midia', async (req, res) => {
  console.log("🔵 Recebido POST /api/enviar-midia:", req.body);

  let { telefone, arquivos, lead_id, remetente_id, remetente } = req.body;

  if (!telefone || !arquivos?.length || !lead_id || !remetente_id || !remetente) {
    return res.status(400).json({ error: "Telefone, arquivos, lead_id, remetente_id e remetente são obrigatórios." });
  }

  // Buscar dados do lead
  let revenda_id = null, vendedor_id = null, remetente_nome = remetente;
  const { data: leadData, error: leadError } = await supabase
    .from('leads')
    .select('revenda_id,vendedor_id,nome')
    .eq('id', lead_id)
    .single();
  if (!leadError && leadData) {
    revenda_id = leadData.revenda_id;
    vendedor_id = leadData.vendedor_id;
    if (!remetente_nome) remetente_nome = leadData.nome;
  }

  // Normalização/Conversões (ex.: webm → ogg para áudio gravado no navegador)
  for (let i = 0; i < arquivos.length; i++) {
    const a = arquivos[i];
    if (a?.nome?.endsWith('.webm') || a?.tipo === 'audio/webm') {
      try {
        const response = await axios.get(a.url, { responseType: 'arraybuffer' });
        const webmBuffer = Buffer.from(response.data, 'binary');
        const oggBuffer = await converterWebmParaOgg(webmBuffer);

        const oggName = a.nome.replace(/\.webm$/i, '.ogg');
        const { error: upErr } = await supabase
          .storage
          .from('mensagens-arquivos')
          .upload(oggName, oggBuffer, { contentType: 'audio/ogg' });
        if (upErr) throw new Error('Erro ao salvar .ogg no Storage: ' + upErr.message);

        const { data: urlData, error: urlErr } = await supabase
          .storage
          .from('mensagens-arquivos')
          .getPublicUrl(oggName);
        if (urlErr) throw new Error('Erro ao gerar URL pública .ogg: ' + urlErr.message);

        arquivos[i] = { url: urlData.publicUrl, nome: oggName, tipo: 'audio' };
      } catch (err) {
        console.error('❌ Erro na conversão .webm → .ogg:', err);
        return res.status(500).json({ error: 'Erro na conversão .webm para .ogg: ' + err.message });
      }
    }
  }

  // Monta arquivosArray para persistir (um único registro, multiarquivo)
  const arquivosArray = arquivos.map(a => ({
    url: a.url,
    nome: a.nome,
    tipo: a.tipo || 'imagem'
  }));

  try {
    // 1) Persist-first: salva a linha no Supabase como "multiarquivo"
    const { data: inserted, error: insertError } = await supabase
      .from('mensagens')
      .insert([{
        lead_id,
        revenda_id,
        vendedor_id,
        mensagem: arquivosArray.map(a => a.nome).join(', '),
        canal: 'WhatsApp Cockpit',
        criado_em: new Date().toISOString(),
        remetente_id: remetente_id || null,
        remetente: telefone,
        remetente_nome,
        tipo: 'multiarquivo',
        arquivos: arquivosArray,
        direcao: 'saida',
        telefone_cliente: telefone,
        lida: false,
        // status_envio: 'pendente', // se existir no schema
      }])
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Erro ao salvar mídia múltipla no Supabase:', insertError.message);
      return res.status(500).json({ error: insertError.message });
    }

    const mensagemRowId = inserted.id;
    const jobId = randomUUID();
    jobIndex.set(jobId, { mensagemRowId, lead_id });

    // 2) Emitir para provider com ACK rápido
    console.log('🔌 [BACKEND] socketProvider connected?', socketProvider?.connected, 'id:', socketProvider?.id);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Provider não respondeu em 7s')), 7000);

      socketProvider.emit(
        'enviarMidia',
        { telefone, arquivos, jobId },
        (ack) => {
          clearTimeout(timeout);
          if (ack && ack.accepted) resolve(true);
          else reject(new Error(ack?.error || 'Provider recusou envio de mídia'));
        }
      );
    });

    // 3) Responde já; o resultado final virá via statusEnvio
    return res.json({ status: 'ok', jobId, mensagem_id: mensagemRowId });

  } catch (err) {
    console.error("❌ Erro geral ao enviar mídia:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/reenviar-arquivo', async (req, res) => {
  const { mensagemId } = req.body;
  if (!mensagemId) {
    console.error('🔴 mensagemId obrigatório');
    return res.status(400).json({ error: 'mensagemId obrigatório' });
  }

  // 1. Busca a mensagem original
  console.log('🔵 1. Buscando mensagem no banco...', mensagemId);
  const { data: mensagem, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('id', mensagemId)
    .single();

  if (error || !mensagem || !mensagem.arquivos || !mensagem.arquivos.length) {
    console.error('🔴 Mensagem não encontrada ou sem arquivos:', error);
    return res.status(404).json({ error: 'Mensagem não encontrada ou sem arquivos' });
  }

  // 2. Busca o arquivo de áudio .ogg
  const arquivoAudio = mensagem.arquivos.find(a => a.tipo === 'audio');
  if (!arquivoAudio) {
    console.error('🔴 Nenhum arquivo de áudio encontrado!');
    return res.status(404).json({ error: 'Nenhum arquivo de áudio encontrado' });
  }

  // 3. Baixa o buffer do .ogg
  let oggBuffer;
  try {
    console.log('🔵 Baixando .ogg:', arquivoAudio.url);
    const response = await axios.get(arquivoAudio.url, { responseType: 'arraybuffer' });
    oggBuffer = Buffer.from(response.data, 'binary');
    console.log('🟢 OGG baixado com sucesso!');
  } catch (e) {
    console.error('🔴 Erro ao baixar áudio:', e.message);
    return res.status(500).json({ error: 'Erro ao baixar áudio: ' + e.message });
  }

  // 4. Converte para mp3
  let mp3Buffer;
  try {
    console.log('🔵 Convertendo ogg para mp3...');
    mp3Buffer = await converterOggParaMp3(oggBuffer);
    console.log('🟢 Conversão para mp3 concluída!');
  } catch (e) {
    console.error('🔴 Erro na conversão:', e.message);
    return res.status(500).json({ error: 'Erro na conversão: ' + e.message });
  }

  // 5. Faz upload do mp3 convertido no Storage e gera a URL pública
  let urlMp3Reenviado = null;
  try {
    const mp3Name = arquivoAudio.nome.replace(/\.ogg$/, `_${Date.now()}_reenviado.mp3`);
    console.log('🔵 Enviando mp3 para storage:', mp3Name);
    const { data: upMp3, error: errMp3 } = await supabase
      .storage
      .from('mensagens-arquivos')
      .upload(mp3Name, mp3Buffer, { contentType: 'audio/mp3' });
    if (errMp3) {
      console.error('🔴 Erro ao salvar mp3 no Storage:', errMp3.message);
      return res.status(500).json({ error: 'Erro ao salvar mp3 no Storage: ' + errMp3.message });
    }

    console.log('🔵 Gerando URL pública do mp3...');
    const { data: urlData, error: urlErr } = await supabase
      .storage
      .from('mensagens-arquivos')
      .getPublicUrl(mp3Name);
    if (urlErr) {
      console.error('🔴 Erro ao gerar URL pública mp3:', urlErr.message);
      return res.status(500).json({ error: 'Erro ao gerar URL pública mp3: ' + urlErr.message });
    }

    urlMp3Reenviado = urlData.publicUrl;
    console.log('🟢 URL pública mp3:', urlMp3Reenviado);
  } catch (e) {
    console.error('🔴 Erro no upload/URL do mp3:', e.message);
    return res.status(500).json({ error: 'Erro no upload/URL do mp3: ' + e.message });
  }

  // 6) Solicita o envio ao provider via Socket.IO (ACK por callback)
try {
  console.log('🔵 Emitindo via socket reenviarAudioIphone...');

  const payload = {
    telefone: mensagem.remetente,               // JID/telefone do cliente
    mp3Base64: mp3Buffer.toString('base64'),    // buffer → base64
    mensagemId: mensagem.id                     // id da linha original
  };

  const ack = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('🔴 Provider não respondeu em 15s');
      reject(new Error('Provider não respondeu em 15s'));
    }, 15000);

    // ✅ único emit com callback
    socketProvider.emit('reenviarAudioIphone', payload, (resp) => {
      clearTimeout(timeout);
      if (resp && resp.ok) {
        resolve(resp); // { ok: true, mensagemId }
      } else {
        reject(new Error(resp?.error || 'Falha ao reenviar áudio'));
      }
    });
  });

  // 7) Atualiza status do reenvio no Supabase
  const { error: updErr } = await supabase
    .from('mensagens')
    .update({
      mensagem_id_externo: ack.mensagemId || null,
      audio_reenviado: true,
      audio_reenviado_em: new Date().toISOString(),
      audio_reenviado_url: urlMp3Reenviado
    })
    .eq('id', mensagem.id);

  if (updErr) {
    console.error('❌ Erro no UPDATE de reenvio:', updErr.message);
    return res.status(500).json({ error: 'Erro ao salvar status de reenvio: ' + updErr.message });
  }

  // Notifica em tempo real a sala do lead
  try {
    io.to(`lead-${mensagem.lead_id}`).emit('audioReenviado', { mensagemId: mensagem.id });
    console.log('📣 Emitido "audioReenviado" para sala', `lead-${mensagem.lead_id}`);
  } catch (_) {}

  console.log('🟢 Reenvio concluído com sucesso!');
  return res.json({ status: 'ok', mensagemId: ack.mensagemId });

} catch (e) {
  console.error('🔴 Erro ao reenviar via provider:', e.message);
  return res.status(500).json({ error: 'Erro ao reenviar via provider: ' + e.message });
}

});

// Lista mensagens de um lead (inclui campos de reenvio)
app.get('/api/mensagens/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;

    const { data, error } = await supabase
      .from('mensagens')
      .select(`
        id,
        lead_id,
        mensagem,
        canal,
        criado_em,
        remetente_id,
        remetente,
        remetente_nome,
        tipo,
        arquivos,
        direcao,
        telefone_cliente,
        lida,
        audio_reenviado,
        audio_reenviado_em,
        audio_reenviado_url
      `)
      .eq('lead_id', leadId)
      .order('criado_em', { ascending: true });

    if (error) {
      console.error('❌ [GET /api/mensagens] erro:', error.message);
      return res.status(500).json({ error: error.message });
    }

    // Log de verificação (remova depois)
    if (Array.isArray(data) && data.length) {
      const ex = data[data.length - 1];
      console.log('🧪 [GET /api/mensagens] exemplo:', {
        id: ex.id,
        audio_reenviado: ex.audio_reenviado,
        audio_reenviado_em: ex.audio_reenviado_em,
        tem_arquivos: !!ex.arquivos,
      });
    }

    return res.json(data || []);
  } catch (e) {
    console.error('❌ [GET /api/mensagens] exceção:', e.message);
    return res.status(500).json({ error: e.message });
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
server.listen(PORT, () => {
  console.log(`🚀 Backend escutando na porta ${PORT}`);

});
