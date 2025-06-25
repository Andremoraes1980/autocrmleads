import { io } from "socket.io-client";
const socket = io("http://localhost:3001"); // ajuste a porta conforme seu backend
import React, { useState, useEffect, useRef } from "react";
import styles from "./Conversa.module.css";
import { supabase } from "../lib/supabaseClient";
import { formatarNome } from "../lib/utils";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Timeline from "../components/Timeline";


function ModalNotaLigacao({ open, onClose, onSave, tempo }) {
  const [nota, setNota] = useState("");

  useEffect(() => {
    if (!open) setNota(""); // limpa ao fechar
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.16)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          minWidth: 280,
          maxWidth: 420,
          width: "100%",
          padding: 28,
          boxShadow: "0 2px 32px rgba(0,0,0,.12)",
          border: "1px solid #eaeaea",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          margin: 16
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, fontWeight: 500, fontSize: 20, color: "#325" }}>
          Registrar ligação
        </h3>
        <div style={{ color: "#555", fontSize: 16, marginBottom: 8 }}>
          Duração: <b>{String(Math.floor(tempo / 60)).padStart(2, '0')}:{String(tempo % 60).padStart(2, '0')}</b>
        </div>
        <textarea
          style={{
            border: "1px solid #cfd8dc",
            borderRadius: 8,
            padding: 8,
            fontSize: 16,
            minHeight: 60
          }}
          placeholder="Como foi a ligação? Observações, resultado etc..."
          value={nota}
          onChange={e => setNota(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid #d32f2f",
              background: "#fff",
              color: "#d32f2f",
              fontWeight: 500
            }}
            onClick={e => {
              e.stopPropagation();
              setNota("");
              onClose();
            }}
          >
            Cancelar
          </button>
          <button
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: "#1877f2",
              color: "#fff",
              fontWeight: 500
            }}
            onClick={e => {
              e.stopPropagation();
              onSave(nota);
              setNota("");
            }}
            disabled={!nota.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function ModalNota({ open, onClose, onSave }) {
  const [nota, setNota] = useState("");

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.16)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          minWidth: 280,
          maxWidth: 420,
          width: "100%",
          padding: 28,
          boxShadow: "0 2px 32px rgba(0,0,0,.12)",
          border: "1px solid #eaeaea",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          margin: 16
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, fontWeight: 500, fontSize: 20, color: "#325" }}>Adicionar Nota</h3>
        <textarea
          style={{
            border: "1px solid #cfd8dc",
            borderRadius: 8,
            padding: 8,
            fontSize: 16,
            minHeight: 80
          }}
          placeholder="Escreva sua nota aqui..."
          value={nota}
          onChange={e => setNota(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button
  style={{
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid #d32f2f",
    background: "#fff",
    color: "#d32f2f",
    fontWeight: 500
  }}
  onClick={e => {
    e.stopPropagation();
    onClose();
  }}
>
  Cancelar
</button>

          <button
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: "#1877f2",
              color: "#fff",
              fontWeight: 500
            }}
            onClick={() => {
              onSave({ nota });
              setNota(""); // limpa ao salvar
            }}
            disabled={!nota.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function statusFormat(etapa) {
  if (!etapa) return "Desconhecido";
  // Remove acentos e transforma em minúsculo/sem espaço
  const key = etapa.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s/g, "");
  const mapa = {
    "semcontato": "Sem Contato",
    "novaproposta": "Nova Proposta",
    "emnegociacao": "Em Negociação",
    "vendido": "Vendido",
    "perdido": "Perdido",
    "naorespondidos": "Não Respondidos"
  };
  return mapa[key] || etapa;
}




function preencherPlaceholders(texto, lead, nomeVendedor) {
  if (!lead || !nomeVendedor) {
    console.warn("Lead ou vendedor não carregado ainda.");
    return texto;
  }

  // Dados adicionais
  const nomeLoja = lead.revenda?.nome || "";
  const telefoneLoja = lead.revenda?.telefone || "";
  const enderecoLoja = lead.revenda?.endereco || "";

  const telefoneVendedor = lead.vendedor?.telefone || "";
  const nomeVendedorUsar = formatarNome(nomeVendedor || lead.vendedor?.nome || "");

  return texto
    .replaceAll("{cliente}", formatarNome(lead.nome) || "")
    .replaceAll("{vendedor}", nomeVendedorUsar)
    .replaceAll("{veiculo}", lead.veiculo || "")
    .replaceAll("{endereco_loja}", enderecoLoja)
    .replaceAll("{telefone_cliente}", lead.telefone || "")
    .replaceAll("{link_veiculo}", lead.link_veiculo || "")
    .replaceAll("{nome_loja}", nomeLoja)
    .replaceAll("{telefone_vendedor}", telefoneVendedor);
}




function ModalAgenda({ open, onClose, onSave }) {
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [descricao, setDescricao] = useState("");

  if (!open) return null;

  return createPortal(
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.16)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }} onClick={onClose}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        minWidth: 280,
        maxWidth: 420,
        width: "100%",
        padding: 28,
        boxShadow: "0 2px 32px rgba(0,0,0,.12)",
        border: "1px solid #eaeaea",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        margin: 16
      }}
      onClick={e => e.stopPropagation()} // <-- AGORA está correto!
      >
        <h3 style={{ margin: 0, fontWeight: 500, fontSize: 20, color: "#325" }}>Agendar retorno</h3>
        <input
          style={{ border: "1px solid #cfd8dc", borderRadius: 8, padding: 8, fontSize: 16 }}
          type="date" value={data} onChange={e => setData(e.target.value)} />
        <input
          style={{ border: "1px solid #cfd8dc", borderRadius: 8, padding: 8, fontSize: 16 }}
          type="time" value={hora} onChange={e => setHora(e.target.value)} />
        <textarea
          style={{ border: "1px solid #cfd8dc", borderRadius: 8, padding: 8, fontSize: 16, minHeight: 60 }}
          placeholder="Observações ou motivo..." value={descricao} onChange={e => setDescricao(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #d32f2f", background: "#fff", color: "#d32f2f", fontWeight: 500 }}
            onClick={e => { e.stopPropagation(); onClose(); }}
          >Cancelar</button>
          <button
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#1877f2", color: "#fff", fontWeight: 500 }}
            onClick={() => onSave({ data, hora, descricao })}
          >Salvar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}



  



const Conversa = () => {
  const [timeline, setTimeline] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [modalNotaLigacaoOpen, setModalNotaLigacaoOpen] = useState(false);
const [notaLigacao, setNotaLigacao] = useState("");
const [duracaoLigacao, setDuracaoLigacao] = useState(0);
  const [emLigacao, setEmLigacao] = useState(false);
  const [tempoLigacao, setTempoLigacao] = useState(0); // segundos
  const timerRef = useRef(null); // NOVO: para guardar o setInterval  
  const { id: leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [temp, setTemp] = useState("quente");
  const [status, setStatus] = useState("Nova Proposta");
  const [expanded, setExpanded] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [canal, setCanal] = useState("WhatsApp Cockpit");
  const [mensagens, setMensagens] = useState([]);
  const caixaRef = useRef(null);
  const [nomeVendedor, setNomeVendedor] = useState("");
  const [mostrarModalVendedor, setMostrarModalVendedor] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [vendedoresLista, setVendedoresLista] = useState([]);
  const [usuarios, setUsuarios] = useState([]);  
const [modalAgendaOpen, setModalAgendaOpen] = useState(false);
const [usuarioAtual, setUsuarioAtual] = useState(null);
const [modalNotaOpen, setModalNotaOpen] = useState(false);
const [mostrarSeta, setMostrarSeta] = useState(false);
const [mostrarFrasesProntas, setMostrarFrasesProntas] = useState(false);
const [frasesProntas, setFrasesProntas] = useState([]);
const [canalSelecionado, setCanalSelecionado] = useState("WhatsApp Cockpit");





const fetchMensagens = async () => {
  try {
    const res = await fetch(`http://localhost:5001/api/mensagens/${leadId}`);
    const data = await res.json();
    setMensagens(data || []);
    console.log("🟢 Mensagens buscadas via API REST:", data);
  } catch (err) {
    console.error("❌ Erro ao buscar mensagens via API REST:", err);
  }
};


const handleSalvarAgendamento = async ({ data, hora, descricao }) => {
  const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
  const eventoTimeline = {
    lead_id: leadId,
    tipo: "agendamento",
    usuario_id: usuarioLocal.id || usuarioAtual?.id,
    criado_em: new Date().toISOString(),
    conteudo: `📅 Agendado para ${data} às ${hora}${descricao ? ": " + descricao : ""}`,
    data,
    hora,
    descricao
  };
  const { error } = await supabase.from("timeline").insert([eventoTimeline]);

  setModalAgendaOpen(false);

  // Recarrega timeline
  const { data: novaTimeline, error: errorTimeline } = await supabase
    .from("timeline")
    .select("id, tipo, conteudo, usuario_id, criado_em, data, hora, descricao, nota, duracao")
    .eq("lead_id", leadId)
    .order("criado_em", { ascending: true });

  if (!errorTimeline) {
    setTimeline(
      (novaTimeline || []).map(ev => ({
        ...ev,
        data_hora: ev.criado_em,
        autor_id: ev.usuario_id,
        detalhes: ev.conteudo,
        data: ev.data,
        hora: ev.hora,
        descricao: ev.descricao,
        nota: ev.nota,
        duracao: ev.duracao,
      }))
    );
  }
};




const handleSalvarLigacao = async (nota) => {
  const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
  const eventoTimeline = {
    lead_id: lead.id,
    tipo: "ligacao",
    usuario_id: usuarioLocal.id || usuarioAtual?.id,
    criado_em: new Date().toISOString(),
    conteudo: `📞 Ligação registrada: ${nota}`,
    duracao: duracaoLigacao,
    nota: nota,
  };
  console.log("🚩 Salvando ligação na timeline:", eventoTimeline);
  const { data, error } = await supabase.from("timeline").insert([eventoTimeline]);
  if (error) {
    console.error("❌ Erro ao registrar ligação:", error.message);
    alert("Erro ao registrar ligação: " + error.message);
  } else {
    console.log("✅ Ligação registrada:", data);
    // Atualiza a timeline imediatamente após salvar
    const { data: novaTimeline, error: erroTimeline } = await supabase
      .from("timeline")
      .select("id, tipo, conteudo, usuario_id, criado_em, duracao, nota")
      .eq("lead_id", lead.id)
      .order("criado_em", { ascending: true });

    if (!erroTimeline) {
      setTimeline(
        (novaTimeline || []).map(ev => ({
          ...ev,
          data_hora: ev.criado_em,
          autor_id: ev.usuario_id,
          detalhes: ev.conteudo,
          duracao: ev.duracao,
          nota: ev.nota,
        }))
      );
    }
  }

  setModalNotaLigacaoOpen(false);
  setNotaLigacao("");
  setDuracaoLigacao(0);
  setTempoLigacao(0);
};


const handleSalvarNota = async ({ nota }) => {
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
  const eventoTimeline = {
    lead_id: lead.id,
    tipo: "anotacao",
    usuario_id: usuarioLocal.id || usuarioAtual?.id,
    criado_em: new Date().toISOString(),
    conteudo: `📝 Nova anotação: ${nota}`,
  };
  await supabase.from("timeline").insert([eventoTimeline]);

  setModalNotaOpen(false);

// Atualiza a timeline após salvar a nota:
const { data, error } = await supabase
  .from("timeline")
  .select("id, tipo, conteudo, usuario_id, criado_em, data, hora, descricao, nota, duracao, etapa_nova, etapa_anterior")
  .eq("lead_id", lead.id)
  .order("criado_em", { ascending: true });

if (!error) {
  setTimeline(
    (data || []).map(ev => ({
      ...ev,
      data_hora: ev.criado_em,
      autor_id: ev.usuario_id,
      detalhes: ev.conteudo,
      data: ev.data,
      hora: ev.hora,
      descricao: ev.descricao,
      nota: ev.nota,
      duracao: ev.duracao,
      etapa_nova: ev.etapa_nova,
      etapa_anterior: ev.etapa_anterior,
    }))
  );
}
};






const iniciarLigacao = () => {
  setEmLigacao(true);
  setTempoLigacao(0);
  timerRef.current = setInterval(() => {
    setTempoLigacao(prev => prev + 1);
  }, 1000);
};

const finalizarLigacao = () => {
  setEmLigacao(false);
  clearInterval(timerRef.current);
  timerRef.current = null;
  setDuracaoLigacao(tempoLigacao);    // Salva duração para uso no modal
  setModalNotaLigacaoOpen(true); 
  // Aqui você pode salvar o tempo da ligação, se quiser
};

// Conversa.jsx
const handleEnviarArquivo = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  if (!usuarioAtual?.id) {
    alert("Usuário não autenticado!");
    return;
  }

  // 1. Faz upload de todos os arquivos e monta o array:
  const arquivos = [];
  for (const file of files) {
    const { data, error } = await supabase.storage
      .from("mensagens-arquivos")
      .upload(`user_${usuarioAtual.id}/${Date.now()}_${file.name}`, file);

    if (error || !data) {
      alert("Erro ao enviar arquivo: " + (error?.message || "Desconhecido"));
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("mensagens-arquivos")
      .getPublicUrl(data.path);

    let tipo = "arquivo";
    if (file.type.startsWith("image/")) tipo = "imagem";
    else if (file.type.startsWith("video/")) tipo = "video";

    arquivos.push({
      url: urlData.publicUrl,
      nome: file.name,
      tipo
    });
  }

  if (arquivos.length === 0) return;

  // 2. Insere uma ÚNICA mensagem com todos os arquivos
  await supabase.from("mensagens").insert([{
    lead_id: leadId,
    remetente: usuarioAtual.nome,
    remetente_id: usuarioAtual.id,
    tipo: "multiarquivo",
    arquivos, // <-- lista com todos
    mensagem: ""
  }]);
};

const inserirFrasePronta = (texto) => {
  const textoPreenchido = preencherPlaceholders(texto, lead, nomeVendedor);
  setMensagem((mensagemAtual) => (mensagemAtual ? mensagemAtual + " " : "") + textoPreenchido);
  setMostrarFrasesProntas(false);
};

useEffect(() => {
  function handleNovaMensagem(data) {
    console.log("🔔 Nova mensagem recebida via socket:", data);
    // Se for do lead atual, atualiza a lista de mensagens
    if (data.lead_id === leadId) {
      setMensagens(mensagensAntigas => [...mensagensAntigas, data.mensagem]);
    }
  }

  socket.on("mensagemRecebida", handleNovaMensagem);

  // Limpeza ao desmontar
  return () => {
    socket.off("mensagemRecebida", handleNovaMensagem);
  };
}, [leadId]);


useEffect(() => {
  // Mensagens normais
  const mensagensFormatadas = (mensagens || []).map(msg => ({
    ...msg,
    tipo_evento: "mensagem"
  }));
  // Eventos timeline
  const eventosTimeline = (timeline || []).map(ev => ({
    ...ev,
    tipo_evento: "timeline"
  }));
  // Junta e ordena
  const combinado = [...mensagensFormatadas, ...eventosTimeline]
    .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
  setHistorico(combinado);
}, [mensagens, timeline]);



useEffect(() => {
  const fecharFrasesProntas = (e) => {
    const elementoFrasesProntas = document.querySelector(".frases-prontas-dropdown");
    if (elementoFrasesProntas && !elementoFrasesProntas.contains(e.target)) {
      setMostrarFrasesProntas(false);
    }
  };

  document.addEventListener("mousedown", fecharFrasesProntas);

  return () => {
    document.removeEventListener("mousedown", fecharFrasesProntas);
  };
}, []);

useEffect(() => {
  setTimeline([
    {
      id: 1,
      tipo: "mensagem",
      data_hora: new Date().toISOString(),
      autor_id: "id-teste",
      detalhes: "Evento teste! Se aparecer, o render está OK.",
    },
  ]);
}, []);





useEffect(() => {
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, []);

useEffect(() => {
    if (!mostrarFrasesProntas) return;
    async function fetchFrasesProntas() {
      const { data } = await supabase.from("frases_prontas").select("id, titulo, texto_frase");
      setFrasesProntas(data || []);
    }
    fetchFrasesProntas();
  }, [mostrarFrasesProntas]);
  




useEffect(() => {
  const buscarUsuarios = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, tipo");
    if (!error && data) {
      setUsuarios(data);
    } else {
      console.error("❌ Erro ao carregar usuarios:", error);
    }
  };
  buscarUsuarios();
}, []);



  // ✅ Hook correto dentro do componente
  useEffect(() => {
    const buscarVendedores = async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome")
        .eq("tipo", "vendedor");
    
      if (!error && data) {
        setVendedoresLista(data);
      } else {
        console.error("❌ Erro ao carregar vendedores:", error);
      }
    };
    
    buscarVendedores();
    
  }, []);

  const trocarVendedor = async (idVendedor) => {
    const vendedorAntigoId = lead?.vendedor_id;
    const vendedorAntigo = mapaUsuarios?.[vendedorAntigoId];
    const vendedorNovo = mapaUsuarios?.[idVendedor];
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
  
    const { error } = await supabase
      .from("leads")
      .update({ vendedor_id: idVendedor })
      .eq("id", lead.id);
  
    if (error) {
      console.error("Erro ao trocar vendedor:", error.message);
      alert("Erro ao trocar vendedor.");
    } else {
      setLead((prev) => ({ ...prev, vendedor_id: idVendedor }));
      setMostrarModalVendedor(false);
  
      // Atualiza o nome do vendedor após troca
      const { data: vendedorData, error: fetchError } = await supabase
        .from("usuarios")
        .select("nome")
        .eq("id", idVendedor)
        .single();
  
      if (!fetchError && vendedorData) {
        setNomeVendedor(vendedorData.nome);
      } else {
        setNomeVendedor(null);
      }
  
      // REGISTRA NO TIMELINE A TROCA
      const { data: insertData, error: insertError } = await supabase.from("timeline").insert([{
        lead_id: lead.id,
        tipo: "troca_vendedor",
        usuario_id: usuarioLocal.id,
        criado_em: new Date().toISOString(),
        conteudo: `🔄  ${vendedorNovo?.nome || "N/A"}`
      }]);
      console.log("INSERT timeline troca_vendedor:", { insertData, insertError });
  
      // Atualiza a timeline imediatamente
      const { data: timelineData, error: timelineError } = await supabase
        .from("timeline")
        .select("id, tipo, conteudo, usuario_id, criado_em, data, hora, descricao, nota, duracao, etapa_nova, etapa_anterior")
        .eq("lead_id", lead.id)
        .order("criado_em", { ascending: true });
      if (!timelineError) {
        setTimeline(
          (timelineData || []).map(ev => ({
            ...ev,
            data_hora: ev.criado_em,
            autor_id: ev.usuario_id,
            detalhes: ev.conteudo,
            data: ev.data,
            hora: ev.hora,
            descricao: ev.descricao,
            nota: ev.nota,
            duracao: ev.duracao,
            etapa_nova: ev.etapa_nova,
            etapa_anterior: ev.etapa_anterior,
          }))
        );
      }
    }
  };
  
  
    

  useEffect(() => {
    const carregarVendedores = async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome")
        .eq("tipo", "vendedor");
  
      if (!error && data) {
        setVendedores(data);
      } else {
        console.error("❌ Erro ao carregar vendedores:", error);
      }
    };
  
    carregarVendedores();
  }, []);
  

  useEffect(() => {
    const verificarUsuario = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
  
      if (error || !user) {
        console.error("❌ Erro ao buscar usuário autenticado:", error);
        return;
      }
  
      const { data: usuarioDB, error: erroDB } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();
  
      if (erroDB || !usuarioDB) {
        console.warn("⚠️ Nenhum registro correspondente na tabela 'usuarios' com esse auth.uid");
      } else {
        // Salva usuário logado no state!
        setUsuarioAtual(usuarioDB);
        console.log("✅ [USUÁRIO OK] Está autorizado via policy:", usuarioDB.tipo);
      }
    };
  
    verificarUsuario();
  }, []);
  

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Não colapsa a mensagem se um modal de Agenda ou Nota estiver aberto
      if (modalAgendaOpen || modalNotaOpen) return;
      if (caixaRef.current && !caixaRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalAgendaOpen, modalNotaOpen]);
  

  useEffect(() => {
    if (!leadId) return;
    setMensagens([]);
    fetchMensagens();
  // (Por enquanto, não conecta realtime — depois podemos melhorar para usar socket)
  }, [leadId]);
  

  useEffect(() => {
    if (!leadId) return;
    async function fetchTimeline() {
      const { data, error } = await supabase
        .from("timeline")
        .select("id, tipo, conteudo, usuario_id, criado_em, data, hora, descricao, nota, duracao, etapa_nova, etapa_anterior")
        .eq("lead_id", leadId)
        .order("criado_em", { ascending: true });
  
      console.log("EVENTOS TIMELINE:", data, error);
  
      if (!error) {
        setTimeline(
          (data || []).map(ev => ({
            ...ev,
            data_hora: ev.criado_em,
            autor_id: ev.usuario_id,
            detalhes: ev.conteudo,
            data: ev.data,
            hora: ev.hora,
            descricao: ev.descricao,
            nota: ev.nota,
            duracao: ev.duracao,
            etapa_nova: ev.etapa_nova,
            etapa_anterior: ev.etapa_anterior,
          }))
        );
      }
    }
    fetchTimeline();
  }, [leadId]);
  
  
  

  // ESTE É NOVO, ADICIONE APÓS O useEffect das mensagens
useEffect(() => {
  if (!leadId) return;

  const fetchLead = async () => {
    const { data, error } = await supabase
  .from("leads")
  .select(`
    *,
    revenda:revenda_id (
      id, nome, telefone, endereco
    ),
    vendedor:vendedor_id (
      id, nome, telefone
    )
  `)
  .eq("id", leadId)
  .single();

    if (error) {
      console.error("Erro ao buscar lead:", error.message);
    } else {
      setLead(data);
      setTemp(data.temperatura || "frio");
      setStatus(data.etapa || "Nova Proposta");
    }
  };

  fetchLead();
}, [leadId]);

  

  useEffect(() => {
    const buscarNomeVendedor = async () => {
      const vendedorId = lead?.vendedor_id;
    
      // 🔍 Tenta pegar do lead, se não tiver, usa o remetente da última mensagem
      const fallbackId = mensagens.length > 0 ? mensagens[mensagens.length - 1].remetente_id : null;
      const idParaBuscar = vendedorId || fallbackId;
    
      if (!idParaBuscar) {
        console.warn("⚠️ Nenhum vendedor ou remetente_id encontrado.");
        setNomeVendedor(null);
        return;
      }
    
      console.log("🔍 Buscando nome do vendedor/remetente:", idParaBuscar);
    
      const { data, error } = await supabase
        .from("usuarios")
        .select("nome")
        .eq("id", idParaBuscar)
        .maybeSingle();
    
      if (error) {
        console.error("❌ Erro ao buscar nome:", error.message);
        setNomeVendedor(null);
      } else if (!data) {
        console.warn("⚠️ Nenhum usuário encontrado com ID:", idParaBuscar);
        setNomeVendedor(null);
      } else {
        console.log("✅ Nome do vendedor encontrado:", data.nome);
        setNomeVendedor(data.nome);
      }
    };
    
    

    buscarNomeVendedor();
  }, [lead?.vendedor_id]);

  function formatarNumeroWhatsApp(telefone) {
    let numero = (telefone || "").replace(/\D/g, "");
  
    // Já está internacional (12~15 dígitos, ex: 55119..., 598..., etc)
    if (numero.length >= 12 && numero.length <= 15) {
      return numero + "@c.us";
    }
    // Número brasileiro com 11 dígitos (celular)
    if (numero.length === 11) {
      return "55" + numero + "@c.us";
    }
    // Número brasileiro com 10 dígitos (fixo)
    if (numero.length === 10) {
      return "55" + numero + "@c.us";
    }
    // Não reconhecido
    return null;
  }
  

  const handleEnviarMensagem = async (e) => {
    if (e) e.preventDefault();
    if (!mensagem.trim()) return;
  
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (!usuarioLocal?.id) {
      console.error("Usuário logado não carregado ainda.");
      alert("Usuário não está logado corretamente.");
      return;
    }
  
    const numeroWhatsapp = formatarNumeroWhatsApp(lead?.telefone);
if (!numeroWhatsapp) {
  alert("Telefone do lead inválido para WhatsApp!");
  return;
}

    const mensagemComPlaceholders = preencherPlaceholders(mensagem, lead, nomeVendedor);
  
    console.log("🔵 [ENVIAR MSG] Enviando para backend:", {
      para: numeroWhatsapp,
      mensagem: mensagemComPlaceholders,
      lead_id: leadId,
      client_id: lead?.client_id || null,
      conversa_id: lead?.conversa_id || null
    });
  
    try {
      const payload = {
        para: numeroWhatsapp,
        mensagem: mensagemComPlaceholders,
        lead_id: leadId,
        revenda_id: lead?.revenda_id,            // <-- essencial
        vendedor_id: lead?.vendedor_id || null,  // <-- essencial
        remetente_id: usuarioLocal.id,
        remetente: usuarioLocal.nome,
        remetente_nome: usuarioLocal.nome,
        canal,                                  // já está definido (WhatsApp Cockpit, etc)
        tipo: "texto",
        direcao: "saida",                       // ou "entrada" conforme o fluxo
        telefone_cliente: lead?.telefone || null,
        lida: false,
        
      };
      
      const res = await fetch("http://localhost:5001/api/enviar-mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
  
      const result = await res.json();
      console.log("🟢 [ENVIAR MSG] Corpo da resposta:", result);
  
      if (result.status === "ok") {
        setMensagem(""); // limpa input
        await fetchMensagens(); // atualiza histórico imediatamente
        console.log("✅ Mensagem enviada e histórico atualizado.");
      } else {
        const erro = result.error || "Erro desconhecido.";
        console.error("Erro ao enviar mensagem via API REST:", erro);
        alert("Erro ao enviar mensagem: " + erro);
      }
    } catch (err) {
      console.error("❌ Erro na requisição para API REST:", err);
      alert("Erro ao enviar mensagem: " + (err.message || "erro desconhecido"));
    }
  };
  

  
  
  
  
  
  

  const handleToggleTemp = async () => {
    const next = { quente: "morno", morno: "frio", frio: "quente" };
    const novaTemp = next[temp];
    setTemp(novaTemp);

    const { error } = await supabase
      .from("leads")
      .update({ temperatura: novaTemp })
      .eq("id", leadId);

    if (error) console.error("Erro ao atualizar temperatura:", error);
  };

  const handleAnexarArquivos = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => alert("📎 Arquivo: " + input.files[0].name);
    input.click();
  };

  const mapaUsuarios = {};
[...(usuarios || [])].forEach(u => {
  if (u && u.id && u.nome) mapaUsuarios[u.id] = { nome: u.nome, tipo: u.tipo };
});

const baixarTodasImagens = async (imagens, groupId = "") => {
  const zip = new JSZip();
  // Pasta dentro do zip (opcional, pode remover groupId se não quiser)
  const folder = groupId ? zip.folder(groupId) : zip;
  for (const arq of imagens) {
    try {
      const response = await fetch(arq.url);
      const blob = await response.blob();
      // Usa o nome original ou gera um nome
      folder.file(arq.nome || `imagem${Math.random()}.jpg`, blob);
    } catch (err) {
      // Ignora se alguma imagem falhar
    }
  }
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, groupId ? `imagens_${groupId}.zip` : "imagens.zip");
};


const renderMensagens = () =>
mensagens.map((msg) => {
  const remetente = mapaUsuarios[msg.remetente_id];
// Considere como "cliente" todo usuário que NÃO for vendedor, admin ou gerente
const isCliente = !["vendedor", "admin", "gerente"].includes(remetente?.tipo);
console.log({
  msg: msg.mensagem,
  remetente: remetente?.nome,
  tipo: remetente?.tipo,
  isCliente,
});


  return (
    <div
    key={msg.id}
    className={styles["conversa-message"]}
  >
    {/* Inicial à ESQUERDA SÓ se for cliente */}
    {isCliente && (
      <div className={styles["conversa-initials"]}>
        {formatarNome(remetente?.nome || "").charAt(0)}
      </div>
    )}
  
  <div
  className={styles["conversa-bubble"]}
  style={
    isCliente
      ? { marginLeft: "31px", marginRight: "16px", width: "80%", minWidth: "180px", maxWidth: "80%" }
      : { marginLeft: "16px", marginRight: "31px", width: "80%", minWidth: "180px", maxWidth: "80%" }
  }
>

    
<div className={styles["conversa-sender"]}>
  {formatarNome(remetente?.nome || "")}
</div>



            {/* Renderiza mensagem de TEXTO */}
            {msg.tipo === "texto" && (
        <span>{msg.mensagem}</span>
      )}

      {/* Renderiza IMAGEM */}
      {msg.tipo === "imagem" && msg.arquivo_url && (
  <div style={{ textAlign: "center", padding: "4px 0" }}>
    <img
      src={msg.arquivo_url}
      alt={msg.nome_arquivo || "Imagem enviada"}
      style={{
        maxWidth: "180px",
        borderRadius: 8,
        margin: "8px 0",
        boxShadow: "0 2px 8px #0001",
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    />
    <div style={{ marginTop: 2 }}>
      {msg.nome_arquivo && (
        <span style={{ fontSize: 12, color: "#666" }}>{msg.nome_arquivo}</span>
      )}
      <a
        href={msg.arquivo_url}
        download={msg.nome_arquivo || "imagem"}
        style={{
          marginLeft: 12,
          color: "#1877f2",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 500,
          border: "1px solid #eee",
          borderRadius: 6,
          padding: "2px 9px",
          background: "#f8f9fa",
          transition: "background .2s",
        }}
        title="Baixar imagem"
      >
        ⬇️ Baixar
      </a>
    </div>
  </div>
)}

{msg.tipo === "video" && msg.arquivo_url && (
  <div style={{ textAlign: "center", padding: "4px 0" }}>
    <video
      controls
      src={msg.arquivo_url}
      style={{
        maxWidth: "220px",
        borderRadius: 8,
        margin: "8px 0",
        boxShadow: "0 2px 8px #0001",
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    />
    <div style={{ marginTop: 2 }}>
      {msg.nome_arquivo && (
        <span style={{ fontSize: 12, color: "#666" }}>{msg.nome_arquivo}</span>
      )}
      <a
        href={msg.arquivo_url}
        download={msg.nome_arquivo || "video"}
        style={{
          marginLeft: 12,
          color: "#1877f2",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 500,
          border: "1px solid #eee",
          borderRadius: 6,
          padding: "2px 9px",
          background: "#f8f9fa",
          transition: "background .2s",
        }}
        title="Baixar vídeo"
      >
        ⬇️ Baixar
      </a>
    </div>
  </div>
)}

{msg.tipo === "multiarquivo" && Array.isArray(msg.arquivos) && (
  (() => {
    const imagens = msg.arquivos.filter(a => a.tipo === "imagem");
    const outros = msg.arquivos.filter(a => a.tipo !== "imagem");
    return (
      <>
        {/* Botão BAIXAR TODAS */}
        {imagens.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "#999" }}>
                {imagens.length} imagem{imagens.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => baixarTodasImagens(imagens, "grupo" + msg.id)}
                style={{
                  background: "#1877f2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 5,
                  padding: "4px 10px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
                title="Baixar todas as imagens"
              >
                ⬇️ Baixar todas
              </button>
            </div>
            {/* GRID DE MINIATURAS */}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: imagens.length === 1 ? "center" : "flex-start",
                marginBottom: 6,
              }}
            >
              {imagens.map((arq, idx) => (
                <div key={arq.url || idx} style={{ position: "relative" }}>
                  <img
                    src={arq.url}
                    alt={arq.nome}
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 7,
                      boxShadow: "0 1px 5px #0002",
                      border: "1.5px solid #e7e7e7",
                      cursor: "pointer",
                    }}
                    title={arq.nome}
                  />
                  <a
                    href={arq.url}
                    download={arq.nome}
                    title="Baixar imagem"
                    style={{
                      position: "absolute",
                      right: 4,
                      bottom: 4,
                      background: "#fff9",
                      borderRadius: 5,
                      padding: "2px 6px",
                      fontSize: 13,
                      color: "#1976d2",
                      textDecoration: "none",
                      boxShadow: "0 0 2px #0001",
                    }}
                  >⬇️</a>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Outros tipos ficam em coluna */}
        {outros.map((arq, idx) => (
          <div key={arq.url || idx} style={{ marginBottom: 6 }}>
            {arq.tipo === "video" && (
              <>
                <video
                  src={arq.url}
                  controls
                  style={{ maxWidth: 220, borderRadius: 8, display: "block" }}
                />
                <a
                  href={arq.url}
                  download={arq.nome}
                  style={{
                    marginLeft: 8,
                    color: "#1877f2",
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >⬇️ Baixar</a>
              </>
            )}
            {arq.tipo === "arquivo" && (
              <a
                href={arq.url}
                download={arq.nome}
                style={{
                  color: "#1976d2",
                  textDecoration: "underline",
                  fontSize: 15,
                  marginLeft: 2,
                }}
              >📎 {arq.nome}</a>
            )}
          </div>
        ))}
      </>
    );
  })()
)}




      {/* Renderiza ARQUIVO (outros tipos) */}
      {msg.tipo === "arquivo" && msg.arquivo_url && (
        <div>
          <a
            href={msg.arquivo_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1877f2", textDecoration: "underline" }}
          >
            📎 {msg.nome_arquivo || "Arquivo enviado"}
          </a>
        </div>
      )}

      <div className={styles["conversa-time"]}>
        {new Date(msg.criado_em).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>

    
  
    {/* Inicial à DIREITA SE NÃO for cliente */}
    {!isCliente && (
      <div className={styles["conversa-initials"]}>
        {formatarNome(remetente?.nome || "").charAt(0)}
      </div>
    )}
  </div>
  
  );
});

  if (!lead) return <div>Carregando lead...</div>;
  console.log("HISTORICO QUE VAI PARA O MAP:", historico);

  return (
    <div className={styles["conversa-wrapper"]}>
      <div className={styles["conversa-header"]}>
        <div className={styles["conversa-top-bar"]}>Conversa</div>
        <div className={styles["conversa-header-content"]}>
          <div className={styles["conversa-header-left"]}>
            <div className={styles["conversa-info-line"]}>
              👤 {formatarNome(lead.nome)}
              <button
                className={`${styles["badge-temp"]} ${styles[temp]}`}
                onClick={handleToggleTemp}
              >
                {temp === "quente" && "Quente"}
                {temp === "morno" && "Morno"}
                {temp === "frio" && "Frio"}
              </button>
            </div>
            {/*<TimelineVertical eventos={timeline} usuarios={mapaUsuarios} /> */}
            <div className={styles["conversa-info-line"]}>📞 {lead.telefone}</div>
            <div className={styles["conversa-info-line"]}>
              {mostrarModalVendedor && (
                <div className={styles["modal-overlay"]}>
                  <div className={styles["modal-content"]}>
                    <h3>👥 Escolher novo vendedor</h3>
                    <ul className={styles["vendedores-lista"]}>
                      {vendedores.map((v) => (
                        <li
                          key={v.id}
                          onClick={() => trocarVendedor(v.id)}
                          className={styles["vendedor-item"]}
                        >
                          {formatarNome(v.nome)}
                        </li>
                      ))}
                    </ul>
                    <button
  className={styles["send-button"]}
  onClick={() => {
    // Aqui você chama a função que troca o vendedor
    // trocarVendedor(idSelecionado); // Ajuste conforme sua lógica
    setMostrarModalVendedor(false);
  }}
>
  Selecionar
</button>

                  </div>
                </div>
              )}

              <div
                className={styles["conversa-info-line"]}
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => setMostrarModalVendedor(true)}
              >
                👨 {nomeVendedor ? formatarNome(nomeVendedor) : "Sem vendedor"}


              </div>

              <select
  className={styles["conversa-status-select"]}
  value={status}
  onChange={async (e) => {
    const novaEtapa = e.target.value;
    setStatus(novaEtapa);

    const { error } = await supabase
      .from("leads")
      .update({ etapa: novaEtapa })
      .eq("id", lead.id);

    if (error) {
      console.error("Erro ao atualizar etapa:", error.message);
      alert("Erro ao salvar nova etapa.");
    } else {
      // ADICIONAR: salva evento na timeline
      const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
      const eventoTimeline = {
        lead_id: lead.id,
        tipo: "etapa",
        usuario_id: usuarioLocal.id,
        criado_em: new Date().toISOString(),
        conteudo: `Alterou Status de ${statusFormat(status)} para ${statusFormat(novaEtapa)}`,
        etapa_nova: novaEtapa,
        etapa_anterior: status,
      };
      
      
      const { data: tlData, error: tlError } = await supabase
        .from("timeline")
        .insert([eventoTimeline]);

      if (tlError) {
        console.error("Erro ao salvar na timeline:", tlError.message);
      } else {
        console.log("Evento timeline inserido:", tlData);

        // ----------- ADICIONE ESSA PARTE AQUI -----------
        // Atualiza a timeline imediatamente
        const { data, error } = await supabase
  .from("timeline")
  .select("id, tipo, conteudo, usuario_id, criado_em, data, hora, descricao, nota, duracao, etapa_nova, etapa_anterior")
  .eq("lead_id", lead.id)
  .order("criado_em", { ascending: true });

          console.log("EVENTOS TIMELINE:", data, error);

          if (!error) {
            setTimeline(
              (data || []).map(ev => ({
                ...ev,
                data_hora: ev.criado_em,
                autor_id: ev.usuario_id,
                detalhes: ev.conteudo,
                data: ev.data,
                hora: ev.hora,
                descricao: ev.descricao,
                nota: ev.nota,
                duracao: ev.duracao,
              }))
            );
          }
          
        // ----------- FIM DO AJUSTE -----------
      }
    }
  }}
>


                <option>Nova Proposta</option>
                <option>Não Respondidos</option>
                <option>Visita Agendada</option>
                <option>Negociação</option>
                <option>Sem Contato</option>
              </select>
              <div className={styles["lead-mini-card"]}>
  <div className={styles["lead-mini-card-top"]}>
    <img
      src={
        lead.origem === "olx"
          ? "/olx.png"
          : lead.origem === "mercadolivre"
          ? "/mercadolivre.png"
          : lead.origem === "webmotors"
          ? "/webmotors.png"
          : "/defaultlogo.png"
      }
      alt={lead.origem}
      className={styles["mini-logo"]}
    />
    <span className={styles["mini-origem"]}>
      {lead.origem ? lead.origem.charAt(0).toUpperCase() + lead.origem.slice(1) : "Origem"}
    </span>
  </div>
  <div
    className={styles["mini-lead-id"]}
    title={lead.id_externo || ""}
  >
    Lead Id&nbsp;–&nbsp;
    <span className={styles["mini-lead-id-text"]}>
      {lead.id_externo || "—"}
    </span>
  </div>
</div>


            </div>
          </div>
          <div className={styles["conversa-header-right"]}>
  <div className={styles["conversa-info-line"]} style={{ display: "flex", alignItems: "center" }}>
    <span
      className={styles["veiculo-truncado"]}
      title={lead.veiculo}
      style={{
        display: "inline-block",
        maxWidth: 220,      // ajuste para o tamanho do seu layout!
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        marginRight: 10,    // espaço entre texto e imagem
      }}
    >
      {lead.veiculo}
    </span>
    {lead.imagem ? (
      <img
        src={lead.imagem}
        alt="Foto do veículo"
        style={{
          width: 36,
          height: 36,
          objectFit: "cover",
          borderRadius: "50%",
          border: "2px solid #eee",
          background: "#fff",
          marginLeft: 0,    // sem margem à esquerda (encosta na borda)
        }}
      />
    ) : (
      <span style={{ marginLeft: 0 }}>🚗</span>
    )}
  </div>
  <div className={styles["conversa-info-line"]}>
  💰 {Number(lead.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
</div>

</div>


        </div>
      </div>

      <div className={styles["conversa-area"]} style={{ position: 'relative', paddingLeft: 36 }}>
  {/* Linha vertical do histórico (fixa no lado esquerdo) */}
  <div
    style={{
      position: 'absolute',
      left: 17,
      top: 0,
      bottom: 0,
      width: 2,
      background: '#e0e7ef',
      borderRadius: 2,
      zIndex: 0,
    }}
  />

{historico.map((item, idx) => {
  const dataAtual = new Date(item.criado_em);
  const anterior = historico[idx - 1];
  const mostrarSeparador =
    idx === 0 ||
    (anterior && new Date(anterior.criado_em).toDateString() !== dataAtual.toDateString());

  return (
    <React.Fragment key={item.id}>
      {mostrarSeparador && (
        <div
          style={{
            width: "100%",
            textAlign: "left",
            margin: "20px 0 10px 0",
            color: "#aaa",
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: 0.2,
            background: "none",
            textTransform: "capitalize",
          }}
        >
          {capitalize(
            dataAtual.toLocaleDateString("pt-BR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "2-digit",
            })
          )}
        </div>
      )}

      {/* 1. EVENTO DE LIGAÇÃO */}
      {item.tipo === "ligacao" && (
        <React.Fragment>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '8px 0 0 0',
              position: 'relative',
              zIndex: 1,
              minHeight: 24,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                background: '#e1f5fe',
                border: '2px solid #4fc3f7',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
                marginLeft: -6,
                boxShadow: '0 2px 8px #b3e5fc90',
              }}
            >
              <span style={{ fontSize: 14, color: '#039be5' }}>📞</span>
            </div>
            <span style={{ fontWeight: 400, color: '#0277bd', fontSize: 12 }}>
              {new Date(item.criado_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {item.usuario_id && mapaUsuarios[item.usuario_id] && (
                <span style={{ marginLeft: 4, color: '#0277bd' }}>
                  {formatarNome(mapaUsuarios[item.usuario_id].nome)}
                </span>
              )}
              <span style={{ marginLeft: 4, color: "#7fa9df" }}>
                registrou uma ligação
              </span>
              {item.duracao && (
                <span style={{ marginLeft: 6, color: "#6ec6ff" }}>
                  (Duração: {String(Math.floor(item.duracao / 60)).padStart(2, '0')}:{String(item.duracao % 60).padStart(2, '0')})
                </span>
              )}
            </span>
          </div>
          {item.nota && (
            <div
              style={{
                background: '#e3f2fd',
                border: '1.5px solid #90caf9',
                borderRadius: 10,
                color: '#01579b',
                fontSize: 13,
                minWidth: '180px',
                maxWidth: '80%',
                width: '80%',
                marginLeft: "16px",
                marginRight: "31px",
                padding: '10px 18px',
                marginBottom: 12,
                boxShadow: '0 2px 8px #90caf955',
                position: 'relative',
                textAlign: "left",
              }}
            >
              {item.nota}
            </div>
          )}
        </React.Fragment>
      )}

      {/* 2. CAPTURA CLASSIFICADO / LEAD RECEBIDO */}
      {(item.tipo === "captura_classificado" || item.tipo === "lead_recebido") && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '8px 0 0 0',
            position: 'relative',
            zIndex: 1,
            minHeight: 24,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: '#f0f6fd',
              border: '2px solid #1976d2',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
              marginLeft: -6,
              boxShadow: '0 2px 8px #1976d240',
            }}
          >
            <span style={{ fontSize: 14, color: '#1976d2' }}>📥</span>
          </div>
          <span style={{ fontWeight: 500, color: '#1976d2', fontSize: 12 }}>
            {new Date(item.criado_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            <span style={{ marginLeft: 7, color: "#2e3953" }}>
              {item.conteudo}
            </span>
          </span>
        </div>
      )}

      {/* 3. MENSAGEM */}
      {item.tipo_evento === "mensagem" && (() => {
        const remetente = mapaUsuarios[item.remetente_id];
        const isCliente = !["vendedor", "admin", "gerente"].includes(remetente?.tipo);

        return (
          <div className={styles["conversa-message"]}>
            {isCliente && (
              <div className={styles["conversa-initials"]}>
                {formatarNome(remetente?.nome || "").charAt(0)}
              </div>
            )}
            <div
              className={styles["conversa-bubble"]}
              style={
                isCliente
                  ? { marginLeft: "31px", marginRight: "16px", width: "80%", minWidth: "180px", maxWidth: "80%" }
                  : { marginLeft: "16px", marginRight: "31px", width: "80%", minWidth: "180px", maxWidth: "80%" }
              }
            >
              <div className={styles["conversa-sender"]}>
                {formatarNome(remetente?.nome || "")}
              </div>
              <span>{item.mensagem}</span>
              <div className={styles["conversa-time"]}>
                {new Date(item.criado_em).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            {!isCliente && (
              <div className={styles["conversa-initials"]}>
                {formatarNome(remetente?.nome || "").charAt(0)}
              </div>
            )}
          </div>
        );
      })()}

      {/* 4. EVENTO DE ANOTAÇÃO, AGENDAMENTO, TROCA VENDEDOR, STATUS */}
      {item.tipo_evento === "timeline" && (() => {
        const isNota = item.tipo === "anotacao";
        const isStatus = item.tipo === "etapa" || item.tipo === "status";

        if (isNota) {
          return (
            <React.Fragment>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '8px 0 0 0',
                  position: 'relative',
                  zIndex: 1,
                  minHeight: 24,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: '#fff8e1',
                    border: '2px solid #ffc107',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    marginLeft: -6,
                    boxShadow: '0 2px 8px #ffe08260',
                  }}
                >
                  <span style={{ fontSize: 11, color: '#ff9800' }}>📝</span>
                </div>
                <span style={{ fontWeight: 400, color: '#916900', fontSize: 11 }}>
                  {new Date(item.criado_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {item.usuario_id && mapaUsuarios[item.usuario_id] && (
                    <span style={{ marginLeft: 4, color: '#916900' }}>
                      {formatarNome(mapaUsuarios[item.usuario_id].nome)}
                    </span>
                  )}
                  <span style={{ marginLeft: 4, color: "#d6b977" }}>
                    adicionou uma nota
                  </span>
                </span>
              </div>
              <div
                style={{
                  background: '#fffde7',
                  border: '1.5px solid #ffe082',
                  borderRadius: 10,
                  color: '#7c5c05',
                  fontSize: 15,
                  minWidth: '180px',
                  maxWidth: '80%',
                  width: '80%',
                  marginLeft: "16px",
                  marginRight: "31px",
                  padding: '12px 20px',
                  marginBottom: 12,
                  boxShadow: '0 2px 8px #ffe08233',
                  position: 'relative',
                }}
              >
                <div style={{
                  fontWeight: 400,
                  fontSize: 12,
                  color: "#222",
                  textAlign: "left",
                }}>
                  {item.conteudo.replace("📝 Nova anotação: ", "")}
                </div>
              </div>
            </React.Fragment>
          );
        }

        if (item.tipo === "agendamento") {
          const dataFormatada = item.data
            ? (() => {
                const d = new Date(item.data);
                if (!isNaN(d.getTime())) {
                  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
                }
                const partes = item.data.split("-");
                if (partes.length === 3) {
                  return partes[2] + '/' + partes[1];
                }
                return item.data;
              })()
            : "";

          return (
            <React.Fragment>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '8px 0 0 0',
                  position: 'relative',
                  zIndex: 1,
                  minHeight: 24,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: '#e8f5e9',
                    border: '2px solid #66bb6a',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    marginLeft: -6,
                    boxShadow: '0 2px 8px #c8e6c9',
                  }}
                >
                  <span style={{ fontSize: 15, color: '#388e3c' }}>📅</span>
                </div>
                <span style={{ fontWeight: 400, color: '#2e7d32', fontSize: 12 }}>
                  {new Date(item.criado_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {item.usuario_id && mapaUsuarios[item.usuario_id] && (
                    <span style={{ marginLeft: 4, color: '#2e7d32' }}>
                      {formatarNome(mapaUsuarios[item.usuario_id].nome)}
                    </span>
                  )}
                  <span style={{ marginLeft: 4, color: "#43a047" }}>
                    agendou um retorno
                  </span>
                  {item.data && item.hora && (
                    <span style={{ marginLeft: 4, color: "#2e7d32" }}>
                      para: {dataFormatada} às {item.hora.slice(0,5)}
                    </span>
                  )}
                </span>
              </div>
              <div
                style={{
                  background: '#e8f5e9',
                  border: '1.5px solid #66bb6a',
                  borderRadius: 10,
                  color: '#2e7d32',
                  fontSize: 15,
                  minWidth: '180px',
                  maxWidth: '80%',
                  width: '80%',
                  marginLeft: "16px",
                  marginRight: "31px",
                  padding: '12px 20px',
                  marginBottom: 12,
                  boxShadow: '0 2px 8px #c8e6c9',
                  position: 'relative',
                }}
              >
                <div style={{
                  fontWeight: 400,
                  fontSize: 13,
                  color: "#2e7d32",
                  textAlign: "left",
                }}>
                  {item.descricao}
                </div>
              </div>
            </React.Fragment>
          );
        }

        if (item.tipo === "troca_vendedor") {
          return (
            <React.Fragment>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '8px 0 0 0',
                  position: 'relative',
                  zIndex: 1,
                  minHeight: 24,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: '#e0f7fa',
                    border: '2px solid #26c6da',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    marginLeft: -6,
                    boxShadow: '0 2px 8px #b2ebf2',
                  }}
                >
                  <span style={{ fontSize: 15, color: '#00838f' }}>🔄</span>
                </div>
                <span style={{ fontWeight: 400, color: '#00838f', fontSize: 12 }}>
                  {new Date(item.criado_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {item.usuario_id && mapaUsuarios[item.usuario_id] && (
                    <span style={{ marginLeft: 4, color: '#00838f' }}>
                      {formatarNome(mapaUsuarios[item.usuario_id].nome)}
                    </span>
                  )}
                  <span style={{ marginLeft: 4, color: "#26c6da" }}>
                    encaminhou o lead para
                  </span>
                  <span style={{ marginLeft: 4, color: "#00838f" }}>
                    {item.conteudo.replace("🔄 ", "")}
                  </span>
                </span>
              </div>
            </React.Fragment>
          );
        }

        if (isStatus) {
          const hora = new Date(item.criado_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const usuario = item.usuario_id && mapaUsuarios[item.usuario_id]
            ? formatarNome(mapaUsuarios[item.usuario_id].nome)
            : "";

          let textoMeio = item.conteudo;
          let statusNovo = "";
          const match = item.conteudo.match(/^(.*?para )(.+)$/i);
          if (match) {
            textoMeio = match[1];
            statusNovo = match[2];
          }

          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '8px 0 8px 0',
                position: 'relative',
                zIndex: 1,
                minHeight: 32,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: '#fff',
                  border: '2px solid #e0e7ef',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  marginLeft: -6,
                  boxShadow: '0 1px 3px rgba(50,70,100,0.05)',
                }}
              >
                <span style={{ fontSize: 11, color: '#1976d2' }}>🔄</span>
              </div>
              <span style={{ fontWeight: 400, color: '#1976d2', fontSize: 11 }}>
                <span style={{ color: "#1976d2" }}>
                  {hora} {usuario}
                </span>
                <span style={{ color: "#b3c9e6", marginLeft: 6 }}>
                  {textoMeio}
                </span>
                <span style={{ color: "#1976d2" }}>
                  {statusNovo}
                </span>
              </span>
            </div>
          );
        }

        return null;
      })()}
    </React.Fragment>
  );
})}</div>




      <div
        ref={caixaRef}
        className={`${styles["message-box-modern"]} ${
          expanded ? styles["expanded"] : styles["collapsed"]
        }`}
      >
        <div className={styles["box-header"]}>
          <div className={styles["left-icon"]} onClick={() => setExpanded(true)}>
            💬 <span className={styles["enviar-mensagem-texto"]}>Enviar mensagem</span>
          </div>
          <div className={styles["actions"]}>
  <span title="Agendar" style={{ cursor: "pointer" }} onClick={() => setModalAgendaOpen(true)}>📅</span>
  <span title="Nota" style={{ cursor: "pointer" }} onClick={() => setModalNotaOpen(true)}>📝</span>

  <span
  title="Ligação"
  style={{ cursor: "pointer", color: emLigacao ? "#1877f2" : "#222" }}
  onClick={() => {
    if (!emLigacao) iniciarLigacao();
    else finalizarLigacao();
  }}
>
  📞
  {emLigacao && (
    <span style={{ marginLeft: 8, fontWeight: 500 }}>
      {String(Math.floor(tempoLigacao / 60)).padStart(2, '0')}:
      {String(tempoLigacao % 60).padStart(2, '0')}
    </span>
  )}
</span>

</div>

        </div>

        <textarea
          className={styles["message-textarea"]}
          placeholder={`Mensagem para ${formatarNome(lead?.nome || "")}...`}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={expanded ? 3 : 1}
        />

        {expanded && (
          <div className={styles["message-tools"]}>
            <div>
            <a onClick={handleAnexarArquivos}>📎 Anexar arquivos</a> &nbsp;

<button
  type="button"
  onClick={e => {
    e.preventDefault();
    setMostrarFrasesProntas(v => !v);
  }}
  style={{
    padding: "6px 14px",
    border: "1px solid #bcd",
    borderRadius: 6,
    background: "#f8fafd",
    fontWeight: 500,
    fontSize: 15,
    color: "#234",
    cursor: "pointer",
    position: "relative",
    marginLeft: 8
  }}
>
  Mensagens prontas
</button>

{mostrarFrasesProntas && (
  <div
    className="frases-prontas-dropdown"
    style={{
      position: "absolute",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: 8,
      top: 35,
      left: 0,
      zIndex: 100,
      boxShadow: "0 2px 16px #0001",
      minWidth: 240,
      maxHeight: 220,
      overflowY: "auto",
      padding: 8
    }}
  >

    {frasesProntas.length === 0 ? (
      <div style={{ color: "#aaa", fontSize: 15 }}>Nenhuma frase pronta cadastrada.</div>
    ) : 
    (
      frasesProntas.map(fp => (
        <div
          key={fp.id}
          style={{
            padding: "8px 8px",
            margin: "3px 0",
            cursor: "pointer",
            borderRadius: 7,
            transition: "background .2s",
            fontSize: 15,
            borderBottom: "1px solid #f3f3f3"
          }}
          onClick={() => inserirFrasePronta(fp.texto_frase)}
          onMouseDown={e => e.preventDefault()}
        >
          <b>{fp.titulo}</b>
          <div style={{ color: "#444", fontSize: 14 }}>{fp.texto_frase}</div>
        </div>
      ))
    )}
  </div>
)}

            </div>
            <div className={styles["message-controls"]}>
              <label>Canal:</label>
              <select
                value={canalSelecionado}
                onChange={e => setCanalSelecionado(e.target.value)}
                className={styles["canal-select"]}
              >
                <option value="WhatsApp Cockpit">WhatsApp Cockpit</option>
                <option value="Chat Interno">Chat Interno</option>
                <option value="Email">Email</option>
              </select>
              <div className="chat-footer">
  {/* ...outros botões/mensagens... */}
  <label htmlFor="anexo-arquivo" style={{ cursor: "pointer" }}>
  <input
  type="file"
  id="anexo-arquivo"
  style={{ display: "none" }}
  accept="image/*,video/*,application/pdf,.doc,.docx"
  multiple
  onChange={handleEnviarArquivo}
/>

    <span
      title="Anexar arquivo"
      style={{ cursor: "pointer", fontSize: 22, verticalAlign: "middle" }}
    >
      📎
    </span>
  </label>
  {/* ...outros botões/mensagens... */}
</div>


<button onClick={handleEnviarMensagem}>Enviar</button>

              

            </div>
          </div>
        )}
      </div>
      <ModalAgenda
  open={modalAgendaOpen}
  onClose={() => setModalAgendaOpen(false)}
  onSave={handleSalvarAgendamento}
/>
<ModalNota
  open={modalNotaOpen}
  onClose={() => setModalNotaOpen(false)}
  onSave={handleSalvarNota}
/>

<ModalNotaLigacao
  open={modalNotaLigacaoOpen}
  onClose={() => setModalNotaLigacaoOpen(false)}
  onSave={handleSalvarLigacao}
  tempo={duracaoLigacao}
/>


    </div>
  );
};
function TimelineVertical({ eventos, usuarios }) {
  const icons = {
    status: "🛣️",
    origem: "🌐",
    vendedor: "👤",
    ligacao: "📞",
    anotacao: "📝",
    agendamento: "📅",
    canal: "💬",
    default: "🔹"
  };

  function eventosComSeparador(eventos) {
    let ultimoDia = "";
    const resultado = [];
    eventos.forEach(ev => {
      const diaAtual = new Date(ev.criado_em).toLocaleDateString();
      if (diaAtual !== ultimoDia) {
        resultado.push({
          id: `data-${diaAtual}`,
          tipo: "data",
          conteudo: diaAtual,
        });
        ultimoDia = diaAtual;
      }
      resultado.push(ev);
    });
    return resultado;
  }

  return (
    <div style={{
      borderLeft: "3px solid #e5e7eb",
      paddingLeft: 16,
      margin: "22px 0 16px 0",
      position: "relative"
    }}>
      <div style={{
        fontWeight: 700, color: "#456", fontSize: 16, marginBottom: 10, marginLeft: -7
      }}>Linha do Tempo</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {eventosComSeparador(eventos).map(ev =>
          ev.tipo === "data" ? (
            <li key={ev.id} style={{
              textAlign: "center",
              color: "#888",
              fontWeight: "bold",
              fontSize: 13,
              margin: "16px 0 8px 0"
            }}>
              {ev.conteudo}
            </li>
          ) : (
            <li key={ev.id} style={{
              position: "relative",
              marginBottom: 18,
              paddingLeft: 12
            }}>
              <span style={{
                position: "absolute",
                left: -28,
                top: 2,
                fontSize: 20
              }}>
                {icons[ev.tipo] || icons.default}
              </span>
              <span style={{ fontWeight: "bold", color: "#1e293b", fontSize: 15 }}>
                {ev.conteudo}
              </span>
              <span style={{ marginLeft: 8, color: "#aaa", fontSize: 12 }}>
                {new Date(ev.criado_em).toLocaleTimeString().slice(0, 5)}
              </span>
              <span style={{ marginLeft: 8, color: "#bdbdbd", fontSize: 13 }}>
                {ev.usuario_id && usuarios?.[ev.usuario_id]?.nome
                  ? `por ${usuarios[ev.usuario_id].nome}`
                  : ""}
              </span>
            </li>
          )
        )}
      </ul>
    </div>
  );
}


export default Conversa;
