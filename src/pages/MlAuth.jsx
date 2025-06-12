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
      // valida CSRF lendo do localStorage
const original = JSON.parse(localStorage.getItem("ml_oauth_state") || "{}");

// (Opcional) remova o state depois de usar:
// localStorage.removeItem("ml_oauth_state");

      if (original.nonce !== stateObj.nonce) {
        console.error("State mismatch – possível ataque CSRF");
        return;
      }

      // 3) Extrai revenda_id do state
      const revenda_id = stateObj.revenda_id;
      console.log("✅ revenda_id from state:", revenda_id);

      // 4) Troca code → token via seu backend
      const { data: tokenData, status } = await axios.post(
        "/api/ml-auth",
        { code },
        { baseURL: import.meta.env.VITE_API_URL }
      );
      console.log("🔄 POST /api/ml-auth status:", status);
      console.log("🔑 tokenData:", tokenData);

      // 5) Insere no Supabase usando revenda_id do state
      const insertRow = {
        usuario_id:    revenda_id,       // ou outro campo que represente o usuário
        revenda_id,
        access_token:  tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        user_id_ml:    tokenData.user_id,
        expires_in:    tokenData.expires_in,
        token_type:    tokenData.token_type,
        scope:         tokenData.scope,
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
