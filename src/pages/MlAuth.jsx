// src/pages/MlAuth.jsx
import { useEffect } from "react";
import axios from "axios";
import { supabase } from "../lib/supabaseClient";
import { log, warn, error } from "../utils/Logger";
import { toast } from 'react-toastify';



export default function MlAuth() {
  useEffect(() => {
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


      console.log("🔍 state retornado (decodificado):", stateObj);
console.log("🔍 state original:", original);



      if (original.nonce !== stateObj.nonce) {
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
        code,
        token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        vencimento: tokenData.expires_in,
        usuario_id: usuarioLocal?.id,
        revenda_id: revenda_id,
        criado_em: new Date().toISOString()
      };
      
      console.log("🚩 Dados para supabase.insert:", insertRow);
      
      const { data, error } = await supabase
        .from("integracoes_ml")
        .insert([insertRow]);
      
      console.log("🎯 supabase.insert resposta →", { data, error });
      
      if (error) {
        console.error("❌ Erro ao salvar integração:", error);
        alert("Erro ao salvar integração: " + error.message);
      } else {
        toast.success("Integração Mercado Livre salva com sucesso!");
      }
      
    })();
  }, []);


  return <div>Conectando ao Mercado Livre…</div>;
}
