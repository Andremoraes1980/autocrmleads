// src/pages/Configuracoes.jsx
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import styles from "./Configuracoes.module.css";
import { supabase } from "../lib/supabaseClient"; 
import IntegracaoMercadoLivre from "../components/integracoes/IntegracaoMercadoLivre";
import CardAutomacao from "../components/automacoes/CardAutomacao";
import ModalNovaAutomacao from "../components/automacoes/ModalNovaAutomacao";
import ModalMensagemAutomacao from "../components/automacoes/ModalMensagemAutomacao";
import ModalNovoTemplate from "../components/ModalNovoTemplate";
import { io } from "socket.io-client";  // ← Adicionado para conectar no provider





export default function Configuracoes() {
  
  const [abaAtiva, setAbaAtiva] = useState("dados-revenda");
  const [nome, setNome] = useState("");
const [endereco, setEndereco] = useState("");
const [telefone, setTelefone] = useState("");
const [instagram, setInstagram] = useState("");
const [site, setSite] = useState("");
const [facebook, setFacebook] = useState("");
const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
const [modalWebmotorsOpen, setModalWebmotorsOpen] = useState(false);
const [webmotorsStatus, setWebmotorsStatus] = useState(""); // "aguardando", "conectado", "desconectado
const [modalNovaAutomacaoOpen, setModalNovaAutomacaoOpen] = useState(false);
const [automacoes, setAutomacoes] = useState([]);
const [modalMensagemOpen, setModalMensagemOpen] = useState(false);
const [indiceAutomacaoSelecionada, setIndiceAutomacaoSelecionada] = useState(null);
const [modalNovoTemplateOpen, setModalNovoTemplateOpen] = React.useState(false);
const [mensagensPorAutomacao, setMensagensPorAutomacao] = useState({});
const [mensagemParaEditar, setMensagemParaEditar] = useState(null);
const [templates, setTemplates] = useState([]);
const [qrCode, setQrCode] = useState(null);

 // Quando estiver na aba "integracoes", conectamos ao socket e ouvimos o evento "qrCode"
   useEffect(() => {
        if (abaAtiva !== "integracoes") return;
        const socket = io(import.meta.env.VITE_SOCKET_PROVIDER_URL);
        socket.on("qrCode", ({ qr }) => {
          setQrCode(qr);
        });
        // limpa ao sair da aba
        return () => {
          socket.disconnect();
          setQrCode(null);
        };
      }, [abaAtiva]);



function handleEditarMensagem(automacaoId, msg) {
  setIndiceAutomacaoSelecionada(automacoes.findIndex(a => a.id === automacaoId));
  setMensagemParaEditar(msg);
  setModalMensagemOpen(true);
}

async function handleExcluirMensagem(automacaoId, mensagemId) {
  if (!window.confirm("Confirma exclusão da mensagem?")) return;
  try {
    // Chame o backend para deletar a mensagem:
    const resp = await fetch(`https://autocrm-backend.onrender.com/api/automacoes-mensagens/${mensagemId}`, {
      method: "DELETE"
    });
    if (!resp.ok) {
      alert("Erro ao excluir!");
      return;
    }
    // Remova do state local:
    setAutomacoes(prev =>
      prev.map(auto =>
        auto.id === automacaoId
          ? { ...auto, mensagens: (auto.mensagens || []).filter(msg => msg.id !== mensagemId) }
          : auto
      )
    );
  } catch (err) {
    alert("Erro de conexão ao excluir!");
    console.error(err);
  }
}


function handleAdicionarTemplate(template) {
  setTemplates(prev => [template, ...prev]);
}

// Função para carregar do backend
async function carregarTemplates() {
  try {
    const resp = await fetch("https://autocrm-backend.onrender.com/api/templates");
    const lista = await resp.json();
    console.log("Templates carregados:", lista);  // <-- Adicione esta linha!
    setTemplates(lista);
  } catch (err) {
    console.error("Erro ao carregar templates:", err);
  }
}

// Chama ao abrir a aba templates
useEffect(() => {
  if (abaAtiva === "templates") {
    carregarTemplates();
  }
}, [abaAtiva]);



useEffect(() => {
  if (automacoes.length === 0) return;

  // Busca as mensagens de cada automação
  automacoes.forEach(auto => {
    if (!auto.id) return; // evita erro se id não existir
    fetch(`https://autocrm-backend.onrender.com/api/automacoes-mensagens?automacao_id=${auto.id}`)
      .then(r => r.json())
      .then(msgs => {
        setMensagensPorAutomacao(prev => ({
          ...prev,
          [auto.id]: msgs
        }));
      })
      .catch(err => {
        console.error("Erro ao buscar mensagens:", err);
        setMensagensPorAutomacao(prev => ({
          ...prev,
          [auto.id]: []
        }));
      });
  });
}, [automacoes]);


async function salvarAutomacao(dados) {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    console.log("Enviando para backend:", { ...dados, revenda_id: usuario.revenda_id });
    const resp = await fetch("https://autocrm-backend.onrender.com/api/automacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dados, revenda_id: usuario.revenda_id })
    });
    const nova = await resp.json();
    console.log("Resposta do backend ao salvar automacao:", nova);
    setAutomacoes(prev => [nova, ...prev]);
  } catch (err) {
    console.error("Erro ao salvar automação:", err);
    alert("Erro ao salvar automação!");
  }
}


// Função para buscar automações do backend
async function carregarAutomacoes() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  
  if (!usuario.revenda_id) return; // ou mostrar alerta
  try {
    const resp = await fetch(`https://autocrm-backend.onrender.com/api/automacoes?revenda_id=${usuario.revenda_id}`);
    const lista = await resp.json();
    console.log("AUTOMAÇÕES RECEBIDAS:", lista); // <-- Adicione esta linha!
    setAutomacoes(lista);
  } catch (err) {
    console.error("Erro ao carregar automações:", err);
  }
}

// Carregar automações quando abrir a aba
useEffect(() => {
  if (abaAtiva === "automacoes") {
    carregarAutomacoes();
  }
}, [abaAtiva]);




function formatarTelefone(valor) {
  valor = valor.replace(/\D/g, "");
  if (valor.length <= 10) {
    return valor.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else {
    return valor.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  }
}

const generateNonce = () => window.crypto.randomUUID();




const salvarRevenda = async (e) => {
  e.preventDefault();
  const dados = { nome, endereco, telefone, instagram, site, facebook };
  console.log("📤 Salvando dados da revenda:", dados);

  const { data, error } = await supabase
    .from("revenda")
    .upsert([dados], { onConflict: "id" });

  if (error) {
    console.error("❌ Erro ao salvar revenda:", error.message);
  } else {
    console.log("✅ Dados da revenda salvos com sucesso:", data);
    alert("Dados salvos!");
  }
};

// Função chamada quando o usuário clica "Já cadastrei"
const handleJaCadastreiWebmotors = async () => {
    // Atualiza status no Supabase (pode ser campo na tabela revenda)
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (!usuario.revenda_id) {
      alert("Faça login primeiro.");
      return;
    }
    // Exemplo: atualiza campo 'webmotors_status'
    const { error } = await supabase
      .from("revenda")
      .update({ webmotors_status: "aguardando" })
      .eq("id", usuario.revenda_id);
  
    if (error) {
      alert("Erro ao atualizar status no banco: " + error.message);
    } else {
      setWebmotorsStatus("aguardando");
      setModalWebmotorsOpen(false);
      alert("Status de integração atualizado! Assim que recebermos o primeiro lead, você verá o status como conectado.");
    }
  };



const handleConectarMercadoLivre = () => {
  console.log("🔥 Cliquei no botão Mercado Livre");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  if (!usuario.revenda_id) {
    alert("Faça login primeiro.");
    return;
  }

  // --- Novo fluxo usando state com generateNonce() ---
  const stateObj = {
   revenda_id: usuario.revenda_id,
    nonce:      generateNonce(),
  };
  // gera e salva o state em localStorage (compartilhado entre janelas)
  localStorage.setItem("ml_oauth_state", JSON.stringify(stateObj));
const state = btoa(JSON.stringify(stateObj));

const clientId    = import.meta.env.VITE_ML_CLIENT_ID;
const redirectUri = import.meta.env.VITE_ML_REDIRECT_URI;

const params = new URLSearchParams({
  response_type: "code",
  client_id: clientId,
  redirect_uri: redirectUri,
  state: state
});

const url = `https://auth.mercadolivre.com.br/authorization?${params}`;

console.log("🌐 Antes do redirect:");
console.log("→ localStorage['ml_oauth_state']:", localStorage.getItem("ml_oauth_state"));
console.log("→ state codificado:", state);
console.log("→ URL final:", url);

window.location.href = url;};






const renderConteudo = () => {
  if (abaAtiva === "dados-revenda") {
    return (
      <div className={styles.abaConteudo}>
        <h3>Dados da Revenda</h3>
        <form className={styles.formRevenda} onSubmit={salvarRevenda}>
          <label>Nome da Revenda:</label>
          <input
            placeholder="Digite o nome da revenda..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={styles.formInput}
          />

          <label>Endereço:</label>
          <input
            placeholder="Digite o endereço..."
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className={styles.formInput}
          />

          <label>Telefone:</label>
          <input
            type="text"
            placeholder="(11) 98765-4321"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            className={styles.formInput}
          />

          <label>Instagram:</label>
          <input
            placeholder="@sua_loja"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={styles.formInput}
          />

          <label>Site:</label>
          <input
            placeholder="https://www.sualoja.com.br"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className={styles.formInput}
          />

          <label>Facebook:</label>
          <input
            placeholder="https://www.facebook.com/sualoja"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            className={styles.formInput}
          />

          <button type="submit" className={styles.botaoSalvar}>Salvar</button>
        </form>
      </div>
    );
  } else if (abaAtiva === "integracoes") {
    return (
      <div className={styles.abaConteudo}>
        <h3>Integrações com Classificados</h3>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {/* OLX */}
          <div className={styles.cardIntegracao}>
            <img src="/olx.png" alt="OLX" style={{ width: 56 }} />
            <div>OLX</div>
            <button className={styles.botaoConectar} disabled>Conectar</button>
          </div>
          
          {/* Webmotors */}
<div className={styles.cardIntegracao}>
  <img src="/webmotors.png" alt="Webmotors" style={{ width: 56 }} />
  <div>Webmotors</div>
  {webmotorsStatus === "conectado" ? (
    <span style={{ color: "green", fontWeight: "bold" }}>Conectado</span>
  ) : webmotorsStatus === "aguardando" ? (
    <span style={{ color: "#E67E22", fontWeight: "bold" }}>Aguardando Lead...</span>
  ) : (
    <button className={styles.botaoConectar} onClick={() => setModalWebmotorsOpen(true)}>
      Conectar
    </button>
  )}

  {/* Modal de instrução */}
  {modalWebmotorsOpen && (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h4>Integração Webmotors</h4>
        <ol>
          <li>Acesse o painel Webmotors da sua loja.</li>
          <li>No campo <b>Callback URL Leads</b>, cole este endereço:<br />
            <code style={{ background: "#f5f5f5", padding: "2px 6px" }}>
              https://autocrm-backend.onrender.com/api/webmotors-leads
            </code>
            <button
              style={{ marginLeft: 8, padding: "2px 10px", cursor: "pointer" }}
              onClick={() =>
                navigator.clipboard.writeText("https://autocrm-backend.onrender.com/api/webmotors-leads")
              }
            >Copiar</button>
          </li>
          <li>Salve e teste o envio de um lead de teste.</li>
          <li>Depois, clique em <b>“Já cadastrei”</b> abaixo.</li>
        </ol>
        <div style={{ display: "flex", gap: 16 }}>
          <button className={styles.botaoConectar} onClick={handleJaCadastreiWebmotors}>
            Já cadastrei
          </button>
          <button className={styles.botaoConectar} onClick={() => setModalWebmotorsOpen(false)}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )}
</div>

          
          {/* Mercado Livre */}
          <IntegracaoMercadoLivre usuarioId={usuarioLocal.id} revendaId={usuarioLocal.revenda_id} />


          {qrCode && (
        <div className={styles.qrContainer} style={{ margin: "24px 0", textAlign: "center" }}>
          <p>Escaneie com o WhatsApp:</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code?size=200x200&data=${encodeURIComponent(qrCode)}`}
            alt="QR Code WhatsApp"
            style={{ width: 200, height: 200 }}
          />
        </div>
      )}
        </div>
      </div>
    );
  } else if (abaAtiva === "automacoes") {
    return (
      <div className={styles.abaConteudo}>
        <h3>Automação de Mensagens</h3>
        <button
  onClick={() => setModalNovaAutomacaoOpen(true)}
  style={{
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    padding: "10px 22px",
    marginBottom: 18,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.07)"
  }}
>
  + Nova Automação
</button>

        <p>
          Gerencie aqui as mensagens automáticas para cada etapa do seu funil.
        </p>
        <div style={{ marginTop: 28 }}>
  {automacoes.length === 0 ? (
    <div style={{ color: "#888", marginTop: 18, fontSize: 16 }}>
      Nenhuma automação cadastrada ainda.
    </div>
  ) : (
    automacoes.map((auto, idx) => (
      <CardAutomacao
        key={auto.id || idx}
        statusColuna={auto.status_coluna}
        nome={auto.nome}
        ativa={auto.ativa}
        canal={auto.canal}
        horario={auto.horario}
        mensagens={mensagensPorAutomacao[auto.id] || []}
        onToggleAtiva={() => {/* implementar depois */}}
        onEditar={msg => {
          setMensagemParaEditar(msg); // <-- Seta a mensagem que será editada
          setIndiceAutomacaoSelecionada(idx);
          setModalMensagemOpen(true);
        }}
        onExcluir={msg => handleExcluirMensagem(auto.id, msg.id)}
        onAdicionarMensagem={() => {
          setMensagemParaEditar(null); // <-- Limpa ao adicionar nova
          setIndiceAutomacaoSelecionada(idx);
          setModalMensagemOpen(true);
        }}
      />
    ))
  )}
</div>

{modalMensagemOpen && (
  <ModalMensagemAutomacao
    open={modalMensagemOpen}
    onClose={() => {
      setModalMensagemOpen(false);
      setIndiceAutomacaoSelecionada(null);
      setMensagemParaEditar(null);
    }}
     onSalvar={async (msg) => {
         const automacaoId = automacoes[indiceAutomacaoSelecionada]?.id;
         try {
           if (msg.id) {
             // EDIÇÃO
             await fetch(
               `https://autocrm-backend.onrender.com/api/automacoes-mensagens/${msg.id}`,
               {
                 method: "PUT",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify(msg)
               }
             );
           } else {
             // CRIAÇÃO
             await fetch(
               "https://autocrm-backend.onrender.com/api/automacoes-mensagens",
               {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                body: JSON.stringify(msg)
               }
             );
           }
           // Recarrega a lista de mensagens **apenas uma vez**:
           const resp = await fetch(
             `https://autocrm-backend.onrender.com/api/automacoes-mensagens?automacao_id=${automacaoId}`
           );
           const msgs = await resp.json();
           setMensagensPorAutomacao(prev => ({
             ...prev,
             [automacaoId]: msgs
           }));
         } catch (err) {
           alert("Erro ao salvar mensagem no backend!");
           console.error(err);
         } finally {
           setModalMensagemOpen(false);
           setIndiceAutomacaoSelecionada(null);
           setMensagemParaEditar(null);
         }
    }}
    
    automacao_id={automacoes[indiceAutomacaoSelecionada]?.id}
    mensagemParaEditar={mensagemParaEditar}
  />
)}




        <div style={{
          background: "#fffbe6",
          border: "1px solid #ffe58f",
          borderRadius: 12,
          padding: "32px",
          color: "#a08c00",
          fontWeight: 500,
          textAlign: "center",
          marginTop: 24
        }}>
          <span>Em breve, você poderá criar automações personalizadas para cada status do seu funil! 🚀</span>
        </div>

        <ModalNovaAutomacao
  open={modalNovaAutomacaoOpen}
  onClose={() => setModalNovaAutomacaoOpen(false)}
  onSalvar={async (automacao) => {
    await salvarAutomacao(automacao);
    setModalNovaAutomacaoOpen(false);
  }}
  
/>

      </div>
    );
    } 
    else if (abaAtiva === "templates") {
      return (
        <div className={styles.abaConteudo}>
          <h3>Templates de Mensagem</h3>
          <button
            onClick={() => setModalNovoTemplateOpen(true)}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              padding: "10px 22px",
              marginBottom: 18,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.07)"
            }}
          >
            + Novo Template
          </button>
    
          {/* LISTAGEM DOS TEMPLATES */}
          <div style={{ marginTop: 28 }}>
            {templates.length === 0 ? (
              <div style={{ color: "#888", fontSize: 16 }}>
                Nenhum template cadastrado ainda.
              </div>
            ) : (
              templates.map(tmp => (
                <div key={tmp.id} style={{
                  margin: "22px auto 0",
                  background: "#fff",
                  borderRadius: 16,
                  maxWidth: 600,
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  padding: "30px 40px 16px 40px",
                  position: "relative"
                }}>
                  <div style={{
                    color: "#2563eb",
                    fontWeight: 700,
                    fontSize: 21,
                    marginBottom: 5,
                    opacity: 0.3,
                    textAlign: "center"
                  }}>
                    {tmp.nome}
                  </div>
                  <div style={{
                    color: "#222",
                    fontSize: 17,
                    fontWeight: 500,
                    marginBottom: 9,
                    textAlign: "center"
                  }}>
                    {tmp.conteudo}
                  </div>
                  <div style={{
                    color: "#aaa",
                    fontSize: 14,
                    marginBottom: 4,
                    textAlign: "center"
                  }}>
                    Status: {tmp.status}
                  </div>
                </div>
              ))
            )}
          </div>
    
          <ModalNovoTemplate
            aberto={modalNovoTemplateOpen}
            onClose={() => setModalNovoTemplateOpen(false)}
            onSalvar={handleAdicionarTemplate}
          />
    
          <p>
            Gerencie aqui seus templates de mensagem para uso em canais como WhatsApp, e-mail, etc.
          </p>
        </div>
      );
    }
    

    else {
    return (
      <div className={styles.abaConteudo}>
        <h3>Outras Configurações</h3>
        {/* futuramente */}
      </div>
    );
  }
};






  return (
    <Layout>
      <div className={styles.mainContainer}>
        <div className={styles.crmHeader}>
          <h2 className={styles.tituloHeader}>Configurações</h2>
        </div>

        <div className={styles.actionContainer}>
        <div className={styles.containerAbas}>
  <button
    className={`${styles.aba} ${
      abaAtiva === "dados-revenda" ? styles.abaAtiva : ""
    }`}
    onClick={() => setAbaAtiva("dados-revenda")}
  >
    Dados da Revenda
  </button>

  <button
    className={`${styles.aba} ${abaAtiva === "integracoes" ? styles.abaAtiva : ""}`}
    onClick={() => setAbaAtiva("integracoes")}
  >
    Integrações
  </button>

  <button
    className={`${styles.aba} ${abaAtiva === "automacoes" ? styles.abaAtiva : ""}`}
    onClick={() => setAbaAtiva("automacoes")}
  >
    Automação
  </button>

  <button
    className={`${styles.aba} ${abaAtiva === "templates" ? styles.abaAtiva : ""}`}
    onClick={() => setAbaAtiva("templates")}
  >
    Templates
  </button>


</div>

          {renderConteudo()}
        </div>
      </div>
    </Layout>
  );
}
