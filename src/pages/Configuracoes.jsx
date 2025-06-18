// src/pages/Configuracoes.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";
import styles from "./Configuracoes.module.css";
import { supabase } from "../lib/supabaseClient"; 
import IntegracaoMercadoLivre from "../components/integracoes/IntegracaoMercadoLivre";


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
          </div>

          {renderConteudo()}
        </div>
      </div>
    </Layout>
  );
}
