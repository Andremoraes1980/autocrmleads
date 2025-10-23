import React, { useState, useEffect } from "react";
import "./home.css";
import ModalLead from "../components/ModalLead";
import FiltroSidebar from "../components/FiltroSidebar";
import ModalUsuario from "../components/ModalUsuario";
import { supabase } from "../lib/supabaseClient";
import CardLead from "../components/CardLead";
import { closestCenter } from "@dnd-kit/core";
import { calcularTempoDecorrido } from "../lib/utils";
import { useNavigate } from "react-router-dom";




import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const etapas = [
  "nova_proposta",
  "nao_respondido",
  "visita_agendada",
  "negociacao",
  "sem_contato",
  "vendido",
  "perdido"
];

const etapaLabels = {
  nova_proposta: "Nova Proposta",
  nao_respondido: "Não Respondidos",
  visita_agendada: "Visita Agendada",
  negociacao: "Negociação",
  sem_contato: "Sem Contato",
  vendido: "Vendido",
  perdido: "Perdido"
};


function DroppableColumn({ etapa, quantidade, children }) {
  const { setNodeRef } = useDroppable({
    id: `coluna-${etapa}`,
    data: { etapa },
  });

  const alturaColuna = Math.max(quantidade * 120, 360);

  return (
    <div
      className="column"
      ref={setNodeRef}
      style={{ minHeight: `${alturaColuna}px`, backgroundColor: "#eaeaea" }}
    >
      <h2>
  {etapaLabels[etapa] || etapa} ({quantidade})
</h2>

      {children}
    </div>
  );
}

function statusFormat(etapa) {
  if (!etapa) return "Desconhecido";
  // Remove acentos e transforma em minúsculo/sem espaço
  const key = etapa.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s/g, "");
  const mapa = {
    "semcontato": "Sem Contato",
    "novaproposta": "Nova Proposta",
    "negociacao": "Em Negociação",
    "vendido": "Vendido",
    "perdido": "Perdido",
    "naorespondidos": "Não Respondidos"
  };
  return mapa[key] || etapa;
}



function SortableCard({ lead, vendedores, onAbrirModalVendedor }) { 
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const navigate = useNavigate();

  const handleTemperaturaChange = async (id, novaTemp) => {
    await supabase.from("leads").update({ temperatura: novaTemp }).eq("id", id);
  };

  const handleVendedorChange = async (id, novoId) => {
    await supabase.from("leads").update({ vendedor_id: novoId }).eq("id", id);
  };

  const handleClick = () => navigate(`/conversa/${lead.id}`);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: 8,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
        pointerEvents: isDragging ? "none" : "auto",
      }}
      className={`card-wrapper ${isDragging ? "dragging" : ""}`}
      onClick={handleClick}
    >
      <CardLead
  id={lead.id}
  nome={lead.nome}
  veiculo={lead.veiculo}
  versao={lead.versao ?? "Modelo não informado"}
  tempoDecorrido={lead.tempoDecorrido}
  imagem={lead.imagem}
  origem={lead.origem}
  temperaturaInicial={lead.temperatura}
  vendedorInicial={lead.vendedor_id}
  vendedorNome={lead.vendedorNome}
  onTemperaturaChange={(nova) => handleTemperaturaChange(lead.id, nova)}
  onVendedorChange={(novo) => handleVendedorChange(lead.id, novo)}
  onAbrirModalVendedor={() => onAbrirModalVendedor(lead)} // Aqui corrigido!
  isDragging={isDragging}
  vendedores={vendedores}
  tempoMsgCliente={lead.tempoMsgCliente} // <-- ADICIONADO
/>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [filtroVisivel, setFiltroVisivel] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarModalVendedor, setMostrarModalVendedor] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [activeLeadId, setActiveLeadId] = useState(null);
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [vendedoresLista, setVendedoresLista] = useState([]);
  const formatarNomeSimplificado = (nomeCompleto) => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ");
    const primeiro = partes[0];
    const ultimo = partes.length > 1 ? partes[partes.length - 1] : "";
    const capitalize = (str) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    return ultimo ? `${capitalize(primeiro)} ${capitalize(ultimo)}` : capitalize(primeiro);
  };
  const trocarVendedor = async (idVendedor) => {
    if (!leadSelecionado) return;
  
    // Captura dados do vendedor antigo e novo para registro no timeline:
    const vendedorAntigoId = leadSelecionado?.vendedor_id;
    const vendedorNovoId = idVendedor;
    const vendedorAntigo = vendedoresLista.find(v => v.id === vendedorAntigoId);
    const vendedorNovo = vendedoresLista.find(v => v.id === vendedorNovoId);
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
  
    const { error } = await supabase
      .from("leads")
      .update({ vendedor_id: idVendedor })
      .eq("id", leadSelecionado.id);
  
    if (error) {
      console.error("Erro ao trocar vendedor:", error.message);
      alert("Erro ao trocar vendedor.");
    } else {
      // REGISTRA NO TIMELINE A TROCA
      const { data: insertData, error: insertError } = await supabase.from("timeline").insert([{
        lead_id: leadSelecionado.id,
        tipo: "troca_vendedor",
        usuario_id: usuarioLocal.id,
        criado_em: new Date().toISOString(),
        conteudo: `🔄  ${vendedorNovo?.nome || "N/A"}`
      }]);
      console.log("INSERT timeline troca_vendedor (HOME):", { insertData, insertError });
  
      setMostrarModalVendedor(false);
      setLeadSelecionado(null);
      await buscarLeads(); // <-- sincroniza tela
    }
  };  

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  
  // ✅ Sessão robusta: monta usuarioAtual somente quando o auth estiver pronto
useEffect(() => {
  let unsub = null;

  const bootstrap = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    const applySession = async (sess) => {
      if (!sess?.user) {
        console.warn('[Auth] sessão ausente; aguardando login');
        setUsuarioAtual(null);
        return;
      }

      const user = sess.user;

      const { data: usuarioDB, error } = await supabase
        .from('usuarios')
        .select('nome, tipo, revenda_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[Auth] erro ao ler public.usuarios:', error);
      }

      setUsuarioAtual({
        id: user.id,
        email: user.email ?? null,
        user_metadata: user.user_metadata ?? {},
        nome: usuarioDB?.nome ?? null,
        tipo: usuarioDB?.tipo ?? null,
        revenda_id: usuarioDB?.revenda_id ?? null,
      });

      console.log('[Auth] usuarioAtual montado:', {
        id: user.id,
        tipo: usuarioDB?.tipo ?? null,
        revenda_id: usuarioDB?.revenda_id ?? null,
      });
    };

    // aplica sessão atual (se houver)
    await applySession(session);

    // escuta mudanças de auth (login/logout/refresh)
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      applySession(newSession);
    });
    unsub = data?.subscription;
  };

  bootstrap();

  return () => {
    unsub?.unsubscribe?.();
  };
}, []);

  
  
  

  useEffect(() => {
    const buscarVendedores = async () => {
      console.log("👤 Tipo usuário:", usuarioAtual?.tipo);


      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome")
        .eq("tipo", "vendedor");
  
      if (!error && data) {
        const formatados = data.map((v) => ({
          ...v,
          nome: formatarNomeSimplificado(v.nome),
        }));
        setVendedores(formatados);
        setVendedoresLista(formatados); // ✅ AQUI!
        console.log("Vendedores carregados:", formatados);
      } else {
        console.error("Erro ao carregar vendedores:", error);
      }
    };
  
    buscarVendedores();
  }, []);
  

  

  useEffect(() => {
  
    const channel = supabase
      .channel("realtime-leads")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, (payload) => {
        const leadAtualizado = payload.new;
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadAtualizado.id
              ? { ...l, ...leadAtualizado, tempoDecorrido: calcularTempoDecorrido(leadAtualizado.created_at) }
              : l
          )
        );
      })
      .subscribe();

    const intervalo = setInterval(() => {
      setLeads((prev) =>
        prev.map((l) => ({
          ...l,
          tempoDecorrido: calcularTempoDecorrido(l.created_at),
        }))
      );
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalo);
    };
  }, []);

  // Sempre que os leads mudarem (fetch novo, drag-and-drop, etc), recalcula tempoDecorrido na hora!
useEffect(() => {
  setLeads((prev) =>
    prev.map((l) => ({
      ...l,
      tempoDecorrido: calcularTempoDecorrido(l.created_at),
    }))
  );
}, [leads.length]);


useEffect(() => {
  if (usuarioAtual) {
    buscarLeads();
  }
}, [usuarioAtual, vendedoresLista]); // mantém vendedores na dependência, mas não bloqueia a 1ª busca


  useEffect(() => {
    const handleFocus = () => {
      // Sempre que a Home ganha foco (ex: volta da conversa), refaz busca dos leads
      buscarLeads();
    };
  
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
  

  // === buscarLeads (versão robusta) ===
const buscarLeads = async () => {
  setLoading(true);

  try {
    // 🔒 Guard: nunca consultar sem usuário válido
    if (!usuarioAtual) {
      console.warn('[buscarLeads] usuarioAtual ausente; abortando busca.');
      setLeads([]);
      return;
    }
    // superadmin pode ver tudo; demais perfis exigem revenda_id
    if (usuarioAtual?.tipo !== 'superadmin' && !usuarioAtual?.revenda_id) {
      console.warn('[buscarLeads] usuário sem revenda_id; abortando busca.', {
        id: usuarioAtual?.id, tipo: usuarioAtual?.tipo
      });
      setLeads([]);
      return;
    }

    let query = supabase.from('leads').select('*');
    console.log('[buscarLeads] tipo:', usuarioAtual?.tipo, 'id:', usuarioAtual?.id);

    // 🌐 Multi-loja
    if (usuarioAtual?.tipo === 'superadmin') {
      console.log('🔵 [buscarLeads] superadmin: sem filtro de revenda.');
    } else if (usuarioAtual?.tipo === 'admin' || usuarioAtual?.tipo === 'gerente') {
      query = query.eq('revenda_id', usuarioAtual.revenda_id);
      console.log('🟢 [buscarLeads] admin/gerente: revenda_id =', usuarioAtual.revenda_id);
    } else {
      query = query.eq('revenda_id', usuarioAtual.revenda_id).eq('vendedor_id', usuarioAtual.id);
      console.log('🟡 [buscarLeads] vendedor: revenda_id & vendedor_id', usuarioAtual.revenda_id, usuarioAtual.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar leads:', error);
      setLeads([]);
      return;
    }

    console.log('🟦 [buscarLeads] Leads carregados do banco:', data?.length ?? 0);

    // 🧠 Enriquecimento: última msg do cliente + nome do vendedor
    const leadsProcessados = await Promise.all(
      (data ?? []).map(async (lead) => {
        // última mensagem do cliente (entrada)
        const { data: msgsCliente } = await supabase
          .from('mensagens')
          .select('*')
          .eq('lead_id', lead.id)
          .eq('direcao', 'entrada')
          .order('criado_em', { ascending: false })
          .limit(1);

        // última mensagem do usuário (saída)
        const { data: msgsUsuario } = await supabase
          .from('mensagens')
          .select('*')
          .eq('lead_id', lead.id)
          .eq('direcao', 'saida')
          .order('criado_em', { ascending: false })
          .limit(1);

        let tempoUltimaMsgCliente = null;
        if (msgsCliente && msgsCliente.length > 0) {
          const ultimaMsgCliente = msgsCliente[0];
          const ultimaMsgUsuario = msgsUsuario && msgsUsuario.length > 0 ? msgsUsuario[0] : null;

          // só ativa o timer se a última ação foi do cliente
          if (!ultimaMsgUsuario || new Date(ultimaMsgCliente.criado_em) > new Date(ultimaMsgUsuario.criado_em)) {
            tempoUltimaMsgCliente = Math.floor((Date.now() - new Date(ultimaMsgCliente.criado_em)) / 1000);
          }
        }

        const vendedorObj = vendedoresLista.find(v => v.id === lead.vendedor_id);
        return {
          ...lead,
          vendedor: vendedorObj?.id || '',
          vendedorNome: vendedorObj ? formatarNomeSimplificado(vendedorObj.nome) : 'Sem vendedor',
          tempoDecorrido: calcularTempoDecorrido(lead.created_at),
          tempoMsgCliente: tempoUltimaMsgCliente,
        };
      })
    );

    setLeads(leadsProcessados);
  } catch (e) {
    console.error('[buscarLeads] exceção não tratada:', e);
    setLeads([]);
  } finally {
    setLoading(false);
  }
};


  const handleCriarLead = async () => {
    await buscarLeads();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
  
    const novoContainer = over.id.startsWith("coluna-")
      ? over.data.current?.etapa
      : leads.find((l) => l.id === over.id)?.etapa;
  
    const leadAtual = leads.find((l) => l.id === active.id);
    if (!leadAtual || leadAtual.etapa === novoContainer) return;
  
    setLeads((prev) =>
      prev.map((l) => (l.id === active.id ? { ...l, etapa: novoContainer } : l))
    );
  
    // Atualiza a etapa no Supabase
    const { error } = await supabase.from("leads").update({ etapa: novoContainer }).eq("id", active.id);
  
    // ADICIONAR: salvar evento na timeline
    if (!error) {
      // Pega o usuário logado localmente
      const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
      const eventoTimeline = {
        lead_id: active.id,
        tipo: "etapa",
        usuario_id: usuarioLocal.id,
        criado_em: new Date().toISOString(),
        conteudo: `Status alterado de ${statusFormat(leadAtual.etapa)} para ${statusFormat(novoContainer)}`,
        etapa_nova: novoContainer,
        etapa_anterior: leadAtual.etapa,
      };
      
      
      
      const { data: tlData, error: tlError } = await supabase
        .from("timeline")
        .insert([eventoTimeline]);
  
      if (tlError) {
        console.error("Erro ao salvar na timeline:", tlError.message, tlError);
      } else {
        console.log("Evento timeline inserido:", tlData);
      }
    } else {
      console.error("Erro ao atualizar etapa do lead:", error);
    }
  };
  

  const formatarNome = (nome) => {
    if (!nome) return "Usuário";
    const partes = nome.trim().split(" ");
    const capitalizar = (str) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    return [capitalizar(partes[0]), capitalizar(partes[partes.length - 1])].join(" ");
  };

  const avatarLetter = (() => {
    const nome =
      usuarioAtual?.nome ||
      usuarioAtual?.user_metadata?.full_name ||
      (usuarioAtual?.email ? usuarioAtual.email.split("@")[0] : "");

    if (!nome) return "U";

    const partes = nome.trim().split(" ");
    const primeira = partes[0]?.[0]?.toUpperCase();
    const ultima = partes.length > 1 ? partes[partes.length - 1]?.[0]?.toUpperCase() : "";
    return `${primeira}${ultima}`;
  })();

  const userName = formatarNome(
    usuarioAtual?.nome ||
      usuarioAtual?.user_metadata?.full_name ||
      (usuarioAtual?.email ? usuarioAtual.email.split("@")[0] : "")
  );

  
  

  return (
    <>
      <header className="crm-header">
        <h1 className="titulo-header">CRM de Leads</h1>
      </header>

      <div className="top-bar">
        <button onClick={() => setFiltroVisivel(true)}>Filtro</button>
        <input type="text" placeholder="Buscar por nome, carro ou temperatura" />
        <button onClick={() => setModalVisivel(true)}>Criar Novo Lead</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="container">
          {etapas.map((etapa) => {
            const leadsEtapa = leads.filter((l) => l.etapa === etapa);
            return (
              <DroppableColumn etapa={etapa} quantidade={leadsEtapa.length} key={etapa}>
                <SortableContext items={leadsEtapa.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  {leadsEtapa.map((lead) => (
                    <SortableCard
                    key={lead.id}
                    lead={lead}
                    vendedores={vendedoresLista}
                    onAbrirModalVendedor={(lead) => {
                      console.log("✅ Lead selecionado para modal:", lead);
                      setLeadSelecionado(lead);
                      setMostrarModalVendedor(true);
                    }}
                  />
                  
                  
                  
                  ))}
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeLeadId && (() => {
            const draggingLead = leads.find((l) => l.id === activeLeadId);
            return draggingLead ? (
              <CardLead
                nome={draggingLead.nome}
                veiculo={draggingLead.veiculo}
                versao={draggingLead.versao ?? "Modelo não informado"}
                tempoDecorrido={draggingLead.tempoDecorrido}
                origem={draggingLead.origem}
                temperaturaInicial={draggingLead.temperatura}
                vendedorInicial={draggingLead.vendedor_id}

              />
            ) : null;
          })()}
        </DragOverlay>
      </DndContext>

      <FiltroSidebar
        visible={filtroVisivel}
        onClose={() => setFiltroVisivel(false)}
        onFilter={(dados) => console.log("Filtros aplicados:", dados)}
      />

      <ModalLead
        visible={modalVisivel}
        onClose={() => setModalVisivel(false)}
        onCreate={handleCriarLead}
        vendedorId={usuarioAtual?.id}
      />

      <ModalUsuario
        visible={modalUsuarioOpen}
        onClose={() => setModalUsuarioOpen(false)}
        onCreate={(usuarioCriado) => {
          console.log("Usuário criado:", usuarioCriado);
        }}
              />
              console.log("🟢 Renderizando modal para lead:", leadSelecionado);


              {mostrarModalVendedor && leadSelecionado && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>👥 Escolher novo vendedor</h3>
      <ul className="vendedores-lista">
        {vendedoresLista.length > 0 ? (
          vendedoresLista.map((v) => (
            <li
              key={v.id}
              onClick={() => trocarVendedor(v.id)}
              className="vendedor-item"
            >
              {v.nome}
            </li>
          ))
        ) : (
          <li>Carregando vendedores...</li>
          )}
          </ul>
          <button onClick={() => setMostrarModalVendedor(false)}>Cancelar</button>
        </div>
      </div>
    )}

    </>
  );
}
