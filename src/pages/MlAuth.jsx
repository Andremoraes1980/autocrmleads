// src/pages/MlAuth.jsx
import { useState, useEffect } from "react"; // Já tem, mas reforce para garantir!
import axios from "axios";
import { supabase } from "../lib/supabaseClient";
import { log, warn, error } from "../utils/Logger";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";




export default function MlAuth() {
const [status, setStatus] = useState("loading"); // <-- ADICIONE AQUI
const navigate = useNavigate();
  useEffect(() => {
    console.log("window.location.search:", window.location.search);
console.log("ml_oauth_state no localStorage:", localStorage.getItem("ml_oauth_state"));

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code  = params.get("code");
      const state = params.get("state");

      if (!code || !state) {
        console.error("Missing code or state in callback");
        return;
      }

      // 1) Decodifica state
      const stateObj = JSON.parse(atob(state));

      // 2) Valida nonce (CSRF protection)
      const original = JSON.parse(localStorage.getItem("ml_oauth_state") || "{}");
      console.log("🔍 window.location.search:", window.location.search);
console.log("🔍 localStorage['ml_oauth_state'] (callback):", localStorage.getItem("ml_oauth_state"));
console.log("🔍 state retornado (query):", state);
console.log("🔍 state decodificado:", stateObj);
console.log("🔍 state original (localStorage):", original);



      console.log("🔍 state retornado (decodificado):", stateObj);
console.log("🔍 state original:", original);



      if (original.nonce !== stateObj.nonce) {
        console.error("❌ State mismatch – possível ataque CSRF");
  console.log("🚨 Nonce salvo:", original.nonce, "Nonce retornado:", stateObj.nonce);
        console.error("State mismatch – possível ataque CSRF");
        return;
      }
      localStorage.removeItem("ml_oauth_state"); // 👈 ADICIONE AQUI


      // 3) Extrai revenda_id do state
      const revenda_id = stateObj.revenda_id;
      console.log("✅ revenda_id from state:", revenda_id);

      // 4) Troca code → token via seu backend
      let tokenData;

try {
  const res = await axios.post(
    "/api/ml-auth",
    { code },
    {
      baseURL: import.meta.env.VITE_API_URL,
    }
  );
  tokenData = res.data;
  log("POST /api/ml-auth status", res.status);
  log("tokenData", tokenData);
} catch (err) {
  error("Erro ao chamar /api/ml-auth", err?.response?.data || err.message);
  toast.error("Erro ao conectar com o Mercado Livre");
  return;
}

const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");

console.log("Conectado ao Mercado Livre!");

      

      // 5) Insere no Supabase usando revenda_id do state
const insertRow = {
  usuario_id: usuarioLocal?.id,                  // OK
  access_token: tokenData.access_token,           // nome correto na tabela!
  refresh_token: tokenData.refresh_token,         // OK
  user_id_ml: tokenData.user_id,                  // user_id do ML
  expires_in: tokenData.expires_in,               // OK
  token_type: tokenData.token_type,               // OK
  scope: tokenData.scope,                         // OK
  revenda_id: revenda_id                          // OK
  // criado_em: NÃO precisa, é automático
  // atualizado_em: NÃO precisa, é automático
};

console.log("🚩 Dados para supabase.insert:", insertRow);

const { data, error } = await supabase
  .from("integracoes_ml")
  .insert([insertRow]);
     
      console.log("🎯 supabase.insert resposta →", { data, error });
      
      if (error) {
        console.error("❌ Erro ao salvar integração:", error);
        setStatus("error");
        toast.error("Erro ao salvar integração: " + error.message);
      } else {
        toast.success("Integração Mercado Livre salva com sucesso!");
        console.log("✅ Integração salva com sucesso!", data);
        setStatus("success");
      }
      
      
    })();
  }, []);


  if (status === "loading") {
    return <div>Conectando ao Mercado Livre…</div>;
  }
  
  if (status === "success") {
    setTimeout(() => {
      navigate("/configuracoes");
    }, 1800);
  
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <div style={{ fontSize: 40, color: "green" }}>✔️</div>
        <h2>Integração Mercado Livre concluída com sucesso!</h2>
        <div>Redirecionando…</div>
      </div>
    );
  }
  
  
  if (status === "error") {
    return (
      <div style={{ textAlign: "center", marginTop: 40, color: "red" }}>
        <div style={{ fontSize: 40 }}>❌</div>
        <h2>Erro ao salvar integração.</h2>
        <button onClick={() => window.location.href = "/configuracoes"}>
          Voltar para configurações
        </button>
      </div>
    );
  }
  
  return null; // fallback de segurança
  
  // ...restante do fluxo de status
  
}
