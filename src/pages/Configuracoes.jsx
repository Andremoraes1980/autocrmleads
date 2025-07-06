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


          {/* Autoline */}
          <div className={styles.cardIntegracao}>
            <img src="/autoline.png" alt="Autoline" style={{ width: 56 }} />
            <div>Autoline</div>
            <button className={styles.botaoConectar} disabled>Conectar</button>
          </div>
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
  {automacoes.length === 0 && (
    <div style={{ color: "#888", marginTop: 18, fontSize: 16 }}>
      Nenhuma automação cadastrada ainda.
    </div>
  )}
  {automacoes.map((auto, idx) => (
    <CardAutomacao
      key={idx}
      statusColuna={auto.statusColuna}
      nome={auto.nome}
      ativa={auto.ativa}
      canal={auto.canal}
      horario={auto.horario}
      mensagens={auto.mensagens}
      onToggleAtiva={() => {/* implementar depois */}}
      onEditar={() => {/* implementar depois */}}
      onExcluir={() =>
        setAutomacoes(automacoes.filter((a, i) => i !== idx))
      }
      onAdicionarMensagem={() => {
        setModalMensagemOpen(true);
        setIndiceAutomacaoSelecionada(idx); // idx é o índice do map
        // Vamos implementar a seguir!
      }}
    />
  ))}
</div>

{modalMensagemOpen && (
  <ModalMensagemAutomacao
    open={modalMensagemOpen}
    onClose={() => setModalMensagemOpen(false)}
    onSalvar={(msg) => {
      setAutomacoes(prev => prev.map((auto, idx) => {
        if (idx !== indiceAutomacaoSelecionada) return auto;
        // Adiciona a nova mensagem no array de mensagens da automação selecionada
        return {
          ...auto,
          mensagens: [
            ...(auto.mensagens || []),
            { ...msg, id: Date.now(), status: "pendente" }
          ]
        }
      }));
      setModalMensagemOpen(false);
      setIndiceAutomacaoSelecionada(null);
    }}
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
          <ModalNovoTemplate
  aberto={modalNovoTemplateOpen}
  onClose={() => setModalNovoTemplateOpen(false)}
  onSalvar={dados => {
    console.log("Dados do novo template:", dados);
  }}
/>

          <p>
            Gerencie aqui seus templates de mensagem para uso em canais como WhatsApp, e-mail, etc. 
          </p>
          {/* Aqui listaremos os templates cadastrados */}
          <div style={{ marginTop: 28 }}>
            {/* TODO: Listagem dos templates */}
          </div>
        </div>
      );}

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
