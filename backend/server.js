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
const cors = require('cors');
const { io: ioClient } = require('socket.io-client');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const QRCode = require('qrcode');
const createSocketServer = require('./connections/socketServer');
const buscarLeadIdPorTelefone = require('./services/buscarLeadIdPorTelefone'); //aqui
const audioReenviado = require('./listeners/provider/audioReenviado');
/** ====== ATIVAR V2 E DESATIVAR ANTIGOS ====== **/
const socketProvider = require('./connections/socketProviderV2');
const receberMensagem = require('./listeners/provider/receberMensagem');
const socketFrontend = require('./connections/socketFrontend');
const ultimoQrCodeDataUrlRef = { value: null }; // referência mutável
const receberQrCode = require('./listeners/provider/receberQrCode');
const io = createSocketServer(server);
const entrarNaSala = require('./listeners/frontend/entrarNaSala');






global.ultimoQrCodeDataUrl = ultimoQrCodeDataUrlRef; // (opcional) caso queira acessar em outros arquivos
socketFrontend(io, socketProvider, ultimoQrCodeDataUrlRef);



io.on('connection', (socket) => {
  console.log('🟢 [IO] Cliente conectado:', socket.id);

  entrarNaSala(socket, io);


  // ⬇️ PROVIDER → BACKEND: recebe o evento que o provider está emitindo
  receberMensagem(socket, io);

  socket.on('disconnect', (reason) => {
    console.log(`🔌 [IO] ${socket.id} desconectou — motivo:`, reason);
  });

});



// Listeners já modularizados corretamente:

// 1. Repassa mensagens recebidas do provider
// Arquivo: backend/listeners/provider/receberMensagem.js



// Arquivo: backend/listeners/provider/audioReenviado.js

audioReenviado(socketProvider, io);

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

  // Logs para debug
  console.log("Canal recebido do frontend:", canal);
  console.log("Remetente recebido do frontend:", remetente);
  console.log("Payload recebido:", req.body);

  // Validação
  if (!para || !mensagem || !lead_id || !remetente_id || !remetente) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  try {
    // 1. Envia a mensagem ao provider via socket
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('⏱️ Provider não respondeu em 7 segundos')),
        7000
      );
       // 1. Defina listeners antes de emitir!
  const okListener = (ok) => {
    clearTimeout(timeout);
    resolve(ok);
    cleanup();
  };
  const errListener = (err) => {
    clearTimeout(timeout);
    reject(new Error(err.error || 'Falha no envio pelo provider'));
    cleanup();
  };
  function cleanup() {
    socketProvider.off('mensagemEnviada', okListener);
    socketProvider.off('erroEnvio', errListener);
  }
  socketProvider.once('mensagemEnviada', okListener);
  socketProvider.once('erroEnvio', errListener);
  // 2. Agora emite
  console.log("📡 Emitindo via socket → enviarMensagem");
  const payload = { para, mensagem };
console.log("🚀 Emitindo para o provider:", payload);

console.log("📡 Socket conectado?", socketProvider.connected);

      socketProvider.emit('enviarMensagem', { para, mensagem });
    });

    // 2. Só depois do envio, busca dados extras do lead:
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('revenda_id,vendedor_id,telefone,nome')
      .eq('id', lead_id)
      .single();

    if (leadError || !leadData) {
      console.error("❌ Não foi possível buscar o lead:", leadError ? leadError.message : 'Lead não encontrado');
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

    const direcao = remetente_id ? 'saida' : 'entrada';

    // 3. Salva mensagem no banco
    const { error: insertError } = await supabase.from('mensagens').insert([{
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
    }]);

    if (insertError) {
      console.error("❌ Erro ao salvar no Supabase:", insertError.message);
      return res.status(500).json({ error: 'Erro ao salvar no Supabase: ' + insertError.message });
    }

    console.log("💾 Mensagem salva com sucesso no Supabase");
    res.json({ status: 'ok' });

  } catch (err) {
    console.error('❌ Erro geral no envio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/enviar-midia', async (req, res) => {
  console.log("🔵 Recebido POST /api/enviar-midia:", req.body);
  let { telefone, arquivos, lead_id, remetente_id, remetente } = req.body;

  if (!telefone || !arquivos?.length) {
    return res.status(400).json({ error: "Telefone e arquivos obrigatórios" });
  }

  // Buscar lead (se quiser preencher revenda_id, vendedor_id)
  let revenda_id = null, vendedor_id = null, remetente_nome = remetente;
  if (lead_id) {
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
  }

  for (let i = 0; i < arquivos.length; i++) {
    let arquivo = arquivos[i];
    if (arquivo.nome.endsWith('.webm') || arquivo.tipo === 'audio/webm') {
      try {
        const response = await axios.get(arquivo.url, { responseType: 'arraybuffer' });
        const webmBuffer = Buffer.from(response.data, 'binary');
        const oggBuffer = await converterWebmParaOgg(webmBuffer);

        const oggName = arquivo.nome.replace(/\.webm$/, '.ogg');
        const { data: upOgg, error: errOgg } = await supabase
          .storage
          .from('mensagens-arquivos')
          .upload(oggName, oggBuffer, { contentType: 'audio/ogg' });

        if (errOgg) throw new Error('Erro ao salvar .ogg no Storage: ' + errOgg.message);

        const { data: urlData, error: urlErr } = await supabase
          .storage
          .from('mensagens-arquivos')
          .getPublicUrl(oggName);

        if (urlErr) throw new Error('Erro ao gerar URL pública .ogg: ' + urlErr.message);

        arquivos[i] = {
          url: urlData.publicUrl,
          nome: oggName,
          tipo: 'audio'
        };
      } catch (err) {
        console.error('❌ Erro na conversão .webm → .ogg:', err);
        return res.status(500).json({ error: 'Erro na conversão .webm para .ogg: ' + err.message });
      }
    }
  }

  try {
    // Envia VIA SOCKET para o provider (igual já faz com enviar-mensagem)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('⏱️ Provider não respondeu em 15 segundos')),
        15000
      );
      socketProvider.once('midiaEnviada', (ok) => {
        clearTimeout(timeout);
        console.log("✅ Provider confirmou envio de mídia:", ok);
        resolve(ok);
      });
      socketProvider.once('erroEnvioMidia', (err) => {
        clearTimeout(timeout);
        console.error("❌ Provider retornou erro na mídia:", err);
        reject(new Error(err.error || 'Falha no envio de mídia pelo provider'));
      });
      console.log("📡 Emitindo via socket → enviarMidia");
      socketProvider.emit('enviarMidia', { telefone, arquivos, lead_id, remetente_id, remetente });
    });

    // Monta array de arquivos e salva uma ÚNICA linha no Supabase, independente da quantidade de arquivos!
    const arquivosArray = arquivos.map(arquivo => ({
      url: arquivo.url,
      nome: arquivo.nome,
      tipo: arquivo.tipo || 'imagem'
    }));

    const { error: insertError } = await supabase.from('mensagens').insert([{
      lead_id,
      revenda_id,
      vendedor_id,
      mensagem: arquivosArray.map(a => a.nome).join(', '), // nomes dos arquivos juntos
      canal: 'WhatsApp Cockpit',
      criado_em: new Date().toISOString(),
      remetente_id: remetente_id || null,
      remetente: telefone,
      remetente_nome,
      tipo: 'multiarquivo',
      arquivos: arquivosArray,
      direcao: 'saida',
      telefone_cliente: telefone,
      lida: false
    }]);
    if (insertError) {
      console.error('❌ Erro ao salvar mídia múltipla no Supabase:', insertError.message);
      return res.status(500).json({ error: insertError.message });
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error("❌ Erro geral ao enviar mídia:", err.message);
    res.status(500).json({ error: err.message });
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

  // 6. Solicita o envio ao provider via Socket.IO e aguarda resposta
  try {
    console.log('🔵 Emitindo via socket reenviarAudioIphone...');
    socketProvider.emit('reenviarAudioIphone', {
      telefone: mensagem.remetente,
      mp3Base64: mp3Buffer.toString('base64'),
      mensagemId: mensagem.id
    });

    // Aguarda confirmação (timeout 15s)
    const resultado = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('🔴 Provider não respondeu em 15s');
        reject(new Error('Provider não respondeu em 15s'));
      }, 15000);

      socketProvider.once('audioReenviado', (data) => {
        clearTimeout(timeout);
        console.log('🟢 Provider confirmou envio:', data);
        resolve(data);
      });
      socketProvider.once('erroReenvioAudio', (err) => {
        clearTimeout(timeout);
        console.error('🔴 Provider retornou erro:', err);
        reject(new Error(err || "Falha ao reenviar áudio"));
      });
    });

    // 7. Atualiza mensagem original no banco com o status de reenvio
    console.log('🔵 Atualizando mensagem original no banco...');
    await supabase.from('mensagens')
      .update({
        mensagem_id_externo: resultado.mensagemId,
        audio_reenviado: true,
        audio_reenviado_em: new Date().toISOString(),
        audio_reenviado_url: urlMp3Reenviado
      })
      .eq('id', mensagem.id);

    console.log('🟢 Reenvio concluído com sucesso!');
    return res.json({ status: 'ok', mensagemId: resultado.mensagemId });
  } catch (e) {
    console.error('🔴 Erro ao reenviar via provider:', e.message);
    return res.status(500).json({ error: 'Erro ao reenviar via provider: ' + e.message });
  }
});

app.get('/api/mensagens/:lead_id', async (req, res) => {
  const { lead_id } = req.params;
  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('lead_id', lead_id)
    .order('criado_em', { ascending: true });

  if (error) {
    console.error("❌ Erro ao buscar mensagens:", error.message);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
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
