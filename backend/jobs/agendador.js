const cron = require('node-cron');
const supabase = require('../config/supabase');
const fetch = require('node-fetch'); // <-- Colado aqui
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const BACKEND_URL = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT}`;



// Agora sim pode usar .tz()
const agora = dayjs().tz("America/Sao_Paulo");
const horaMinuto = agora.format("HH:mm");


console.log("⏰ [AGENDADOR] Cron de mensagens automáticas INICIADO!");


async function sendWhatsappMessage(lead, texto) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/enviar-mensagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          para: lead.telefone,           // formato internacional
          mensagem: texto,
          lead_id: lead.id,
          remetente_id: null,
          remetente: 'Automação',
          canal: 'WhatsApp Cockpit',
          tipo: 'texto',
          telefone_cliente: lead.telefone,
          lida: false
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro desconhecido');
      console.log(`[CRON][WhatsApp] Enviado para ${lead.nome || lead.telefone}:`, texto);
    } catch (err) {
      console.error(`[CRON][WhatsApp][ERRO] Falha ao enviar para ${lead.nome || lead.telefone}:`, err.message || err);
    }
  }

  async function sendEmailMessage(lead, texto) {
    console.log(`(MENSAGEM MOCK EMAIL) Para: ${lead.email} — Texto: ${texto}`);
  }
  
  async function sendChatMessage(lead, texto) {
    console.log(`(MENSAGEM MOCK CHAT) Para: ${lead.nome || lead.id} — Texto: ${texto}`);
  }
  
  

// === CRON JOB: Disparo de mensagens automáticas por etapa e horário ===
cron.schedule('* * * * *', async () => {
    // LOG com horário de SP
    const agoraSP = dayjs().tz("America/Sao_Paulo");
    const horaMinuto = agoraSP.format("HH:mm");
    console.log(`[CRON] Executando agendador (SP): ${agoraSP.format("DD/MM/YYYY HH:mm")}`);
  
    // Busca todas mensagens automáticas ativas para esse horário
    const { data: mensagens, error } = await supabase
      .from('automacoes_mensagens')
      .select('*, automacao:automacoes_leads(status_coluna)')
      .eq('ativa', true)
      .eq('horario', horaMinuto);
  
    if (error) {
      console.error("[CRON] Erro ao buscar mensagens automáticas:", error.message);
      return;
    }
  
    if (mensagens.length === 0) return; // Nada a disparar nesse minuto
  
    for (const msg of mensagens) {
      // Busca todos os leads que estão na etapa/coluna dessa automação
      const { data: leads, error: errorLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('etapa', msg.automacao.status_coluna);
  
      if (errorLeads) {
        console.error("[CRON] Erro ao buscar leads para automação:", errorLeads.message);
        continue;
      }
  
      for (const lead of leads) {
        for (const canal of msg.canais || []) {
            try {
              if (canal === 'whatsapp') {
                await sendWhatsappMessage(lead, msg.texto);
                console.log(`[CRON] (WhatsApp) Enviado para lead ${lead.id}:`, msg.texto);
              } else if (canal === 'email') {
                await sendEmailMessage(lead, msg.texto);
                console.log(`[CRON] (Email) Enviado para lead ${lead.id}:`, msg.texto);
              } else if (canal === 'chat') {
                await sendChatMessage(lead, msg.texto);
                console.log(`[CRON] (Chat) Enviado para lead ${lead.id}:`, msg.texto);
              }
            } catch (err) {
              console.error(`[CRON][ERRO] Falha ao enviar via ${canal} para lead ${lead.id}:`, err.message || err);
            }
          }
          
      }
    }
  });

  

  
  
  