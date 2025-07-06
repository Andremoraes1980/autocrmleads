// src/pages/Configuracoes.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";
import styles from "./Configuracoes.module.css";
import { supabase } from "../lib/supabaseClient"; 
import IntegracaoMercadoLivre from "../components/integracoes/IntegracaoMercadoLivre";
import CardAutomacao from "../components/automacoes/CardAutomacao";
import ModalNovaAutomacao from "../components/automacoes/ModalNovaAutomacao";
const [automacoes, setAutomacoes] = useState([]);







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
    // ... (igual está)
  } else if (abaAtiva === "integracoes") {
    // ... (igual está)
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
        // Vamos implementar a seguir!
      }}
    />
  ))}
</div>


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
  onSalvar={(automacao) => {
    setModalNovaAutomacaoOpen(false);
    setAutomacoes(prev => [...prev, { ...automacao, mensagens: [] }]);
  }}
  
/>

      </div>
    );
  } else {
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
</div>

          {renderConteudo()}
        </div>
      </div>
    </Layout>
  );
}
