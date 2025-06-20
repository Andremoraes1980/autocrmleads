require('dotenv').config();
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function limparTexto(texto) {
  return texto
    .replace(/\[.*?\]\(.*?\)/g, "")   // remove markdown [img](url)
    .replace(/https?:\/\/\S+/g, "")   // remove links diretos
    .replace(/<.*?>/g, "")            // remove tags HTML
    .replace(/[\[\]{}]+/g, "")        // remove colchetes e chaves
    .replace(/\n+/g, " ")             // troca quebras de linha por espaço
    .replace(/\s{2,}/g, " ")          // múltiplos espaços por um só
    .replace(/^\s+|\s+$/gm, "");      // remove espaços início/fim de cada linha
}

// ---- Função para extrair campos do lead OLX ----
function extrairCamposOLX(texto) {
  const nome    = texto.match(/Nome:\s*([^\n\r]+)/i)?.[1]?.trim() || "";
  const email   = texto.match(/Email:\s*([^\n\r]+)/i)?.[1]?.trim() || "";
  const fone    = texto.match(/Telefone:\s*([^\n\r]+)/i)?.[1]?.trim() || "";
  const mensagem= texto.match(/mensagem de [^\:]+:\s*([\s\S]*?)\nNome:/i)?.[1]?.trim() || "";
  const veiculo = texto.match(/Telefone:\s*[^\n\r]+\s*([\s\S]*?)\nR\$/i)?.[1]?.trim() || "";
  const valor   = texto.match(/R\$ ?([0-9\.,]+)/i)?.[1]?.trim() || "";
  const leadId  = texto.match(/Identificador do lead: ([\w-]+)/i)?.[1]?.trim() || "";

  // Pega a imagem do veículo (primeira que bate com img.olx.com.br/thumbsli/)
  const imagemVeiculoMatch = texto.match(/https?:\/\/img\.olx\.com\.br\/thumbsli\/[^\s'"]+\.(jpg|jpeg|png)/i);
  const imagem = imagemVeiculoMatch ? imagemVeiculoMatch[0] : "";

  return {
    nome: limparTexto(nome),
    email: limparTexto(email),
    fone: limparTexto(fone),
    mensagem: limparTexto(mensagem),
    veiculo: limparTexto(veiculo),
    valor: limparTexto(valor),
    leadId: limparTexto(leadId),
    imagem
  };
}

// Função que lê e processa e-mails de UMA revenda
async function lerEmailsDaRevenda(revenda) {
  const imapConfig = {
    user: revenda.user_leads,
    password: revenda.imap_password,
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT),
    tls: true,
    authTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false },
  };

  try {
    const connection = await imaps.connect({ imap: imapConfig });
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN']; // Só não lidos
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true // Marcar como lido ao processar
    };

    const results = await connection.search(searchCriteria, fetchOptions);

    console.log(`📨 Revenda "${revenda.nome}" (${revenda.user_leads}) - ${results.length} e-mails não lidos.`);

    for (const res of results) {
      const all = res.parts.find(part => part.which === '');
      const parsed = await simpleParser(all.body);

      const texto = parsed.text;

      // Extrai os campos do lead OLX
      const lead = extrairCamposOLX(texto);

      const leadSupabase = {
        nome: lead.nome || "",
        telefone: lead.fone || "",
        veiculo: lead.veiculo || "",
        origem: "olx",
        data_chegada: new Date().toISOString(),
        temperatura: "frio",
        etapa: "nova proposta",
        created_at: new Date().toISOString(),
        vendedor_id: null,
        revenda_id: revenda.id,
        id_externo: lead.leadId || "",
        email: lead.email || "",
        imagem: lead.imagem || ""
      };

      // Verifica duplicidade antes de inserir
      const { data: leadExistente } = await supabase
        .from('leads')
        .select('id')
        .eq('id_externo', leadSupabase.id_externo)
        .eq('origem', leadSupabase.origem);

      if (leadExistente && leadExistente.length > 0) {
        console.log("⚠️ Lead duplicado não inserido:", leadSupabase.id_externo, "-", leadSupabase.origem);
      } else {
        const { data, error } = await supabase.from('leads').insert([leadSupabase]);
        if (error) {
          console.error("❌ Erro ao inserir lead OLX no Supabase:", error);
        } else {
          console.log("✅ Lead OLX salvo no Supabase:", data);

          // --- Adiciona evento na timeline ---
          if (data && data[0] && data[0].id) {
            const timelineRow = {
              lead_id: data[0].id,
              tipo: 'captura_olx',
              conteudo: `Lead captado automaticamente da OLX em ${new Date().toLocaleString("pt-BR")}`,
              criado_em: new Date().toISOString(),
              usuario_id: null // ou o id do usuário responsável, se aplicável
            };
            const { error: errorTimeline } = await supabase.from('timeline').insert([timelineRow]);
            if (errorTimeline) {
              console.error("❌ Erro ao inserir evento na timeline:", errorTimeline);
            } else {
              console.log("🕒 Evento registrado na timeline.");
            }
          }
        }
      }
    }

    connection.end();
  } catch (error) {
    console.error(`Erro ao processar e-mails para a revenda "${revenda.nome}":`, error);
  }
}

// Função principal: busca TODAS as revendas e processa cada uma
async function processarLeadsDeTodasRevendas() {
  const { data: revendas, error } = await supabase.from('revenda').select('*');
  if (error) {
    console.error("Erro ao buscar revendas:", error);
    return;
  }
  if (!revendas || revendas.length === 0) {
    console.log("Nenhuma revenda encontrada.");
    return;
  }

  // Processa cada revenda sequencialmente (pode ser paralelizado se quiser)
  for (const revenda of revendas) {
    await lerEmailsDaRevenda(revenda);
  }
}

// Executa
processarLeadsDeTodasRevendas();
