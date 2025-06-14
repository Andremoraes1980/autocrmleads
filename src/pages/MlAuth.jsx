// src/pages/MlAuth.jsx
import { useEffect } from "react";
import axios from "axios";
import { supabase } from "../lib/supabaseClient";

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
      const original = JSON.parse(sessionStorage.getItem("ml_oauth_state") || "{}");
      if (original.nonce !== stateObj.nonce) {
        console.error("State mismatch – possível ataque CSRF");
        return;
      }

      // 3) Extrai revenda_id do state
      const revenda_id = stateObj.revenda_id;
      console.log("✅ revenda_id from state:", revenda_id);

      // 4) Troca code → token via seu backend
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/ml-auth`, { code });

const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
console.log("Conectado ao Mercado Livre!");

      

      // 5) Insere no Supabase usando revenda_id do state
      const insertRow = {
        code,
        token: res.data.access_token,
        refresh_token: res.data.refresh_token,
        vencimento: res.data.expires_in,
        usuario_id: usuarioLocal?.id,
        revenda_id: revenda_id,
        criado_em: new Date().toISOString()
      };
      
      console.log("🚩 Dados para supabase.insert:", insertRow);

      const { data, error } = await supabase
        .from("integracoes_ml")
        .insert([insertRow]);

      console.log("🎯 supabase.insert resposta →", { data, error });
      if (error) alert("Erro ao salvar integração: " + error.message);
      else      alert("Integração salva com sucesso!");
    })();
  }, []);


  return <div>Conectando ao Mercado Livre…</div>;
}
