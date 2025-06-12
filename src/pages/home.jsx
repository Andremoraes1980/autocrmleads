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
import { importarLeadsML } from "../integracoes/integracao_mercadolivre";



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
  "Nova Proposta",
  "Não Respondidos",
  "Visita Agendada",
  "Negociação",
  "Sem Contato",
];

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
        {etapa} ({quantidade})
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
    "emnegociacao": "Em Negociação",
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
  origem={lead.origem}
  temperaturaInicial={lead.temperatura}
  vendedorInicial={lead.vendedor_id}
  vendedorNome={lead.vendedorNome}
  onTemperaturaChange={(nova) => handleTemperaturaChange(lead.id, nova)}
  onVendedorChange={(novo) => handleVendedorChange(lead.id, novo)}
  onAbrirModalVendedor={() => onAbrirModalVendedor(lead)} // Aqui corrigido!
  isDragging={isDragging}
  vendedores={vendedores}
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
  
  useEffect(() => {
    const verificarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      const { data: usuarioDB } = await supabase
  .from("usuarios")
  .select("nome, tipo, revenda_id") // <-- traga também o revenda_id
  .eq("id", user.id)
  .single();

setUsuarioAtual({
  ...user,
  nome: usuarioDB?.nome || null,
  tipo: usuarioDB?.tipo || null,
  revenda_id: usuarioDB?.revenda_id || null, // <-- ESSENCIAL!
});

    };
    verificarUsuario();
  }, []);

  useEffect(() => {
    if (usuarioAtual?.revenda_id) {
      importarLeadsML(usuarioAtual.revenda_id);
    }
  }, [usuarioAtual]);
  
  

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

  useEffect(() => {
    if (usuarioAtual && vendedoresLista.length > 0) {
      buscarLeads();
    }
  }, [usuarioAtual, vendedoresLista]);

  const buscarLeads = async () => {
    setLoading(true);

    let query = supabase.from("leads").select("*");
console.log("[buscarLeads] Tipo do usuário:", usuarioAtual?.tipo, "ID:", usuarioAtual?.id);

// Adaptação para multi-loja + superadmin:
if (usuarioAtual?.tipo === "superadmin") {
  // superadmin: vê todos os leads de todas as revendas
  console.log("🔵 [buscarLeads] Usuário superadmin: sem filtro de revenda.");
} else if (usuarioAtual?.tipo === "admin" || usuarioAtual?.tipo === "gerente") {
  // admin/gerente: vê todos os leads da sua loja
  query = query.eq("revenda_id", usuarioAtual.revenda_id);
  console.log("🟢 [buscarLeads] Usuário admin/gerente: filtrando por revenda_id:", usuarioAtual.revenda_id);
} else {
  // vendedor: vê só os leads dele, na sua loja
  query = query
    .eq("revenda_id", usuarioAtual.revenda_id)
    .eq("vendedor_id", usuarioAtual.id);
  console.log("🟡 [buscarLeads] Usuário vendedor: filtrando por revenda_id e vendedor_id:", usuarioAtual.revenda_id, usuarioAtual.id);
}

    

console.log("🟦 [buscarLeads] Tipo do usuário:", usuarioAtual?.tipo, "ID:", usuarioAtual?.id);

const { data, error } = await query;

console.log("🟦 [buscarLeads] Leads carregados do banco:", data);



    if (!error) {
      const leadsProcessados = data.map((lead) => {
        const vendedorObj = vendedoresLista.find(v => v.id === lead.vendedor_id);
        if (!vendedorObj) {
          console.warn("Lead sem vendedor correspondente:", lead);
        }
        return {
          ...lead,
          vendedor: vendedorObj?.id || "",
          vendedorNome: vendedorObj ? formatarNomeSimplificado(vendedorObj.nome) : "Sem vendedor",
          tempoDecorrido: calcularTempoDecorrido(lead.created_at),
        };
      });
      
      console.log("Leads processados:", leadsProcessados);
      setLeads(leadsProcessados);
      
    }
    
    else {
      console.error("Erro ao buscar leads:", error);
    }

    setLoading(false);
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
