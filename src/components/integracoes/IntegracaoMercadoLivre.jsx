// src/components/integracoes/IntegracaoMercadoLivre.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-toastify";
import styles from "./IntegracaoMercadoLivre.module.css";


export default function IntegracaoMercadoLivre({ usuarioId, revendaId }) {
  const [integracao, setIntegracao] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ao carregar, busca integração
  useEffect(() => {
    async function buscarIntegracao() {
      const { data } = await supabase
        .from("integracoes_ml")
        .select("*")
        .eq("usuario_id", usuarioId)
        .eq("revenda_id", revendaId)
        .single();

      setIntegracao(data);
      setLoading(false);
    }

    buscarIntegracao();
  }, [usuarioId, revendaId]);

  // Função de conexão
  function handleConectar() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (!usuario.revenda_id) {
      toast.error("Faça login primeiro.");
      return;
    }

    const stateObj = {
      revenda_id: usuario.revenda_id,
      nonce: window.crypto.randomUUID(),
    };
    localStorage.setItem("ml_oauth_state", JSON.stringify(stateObj));
    const state = btoa(JSON.stringify(stateObj));

    const clientId = import.meta.env.VITE_ML_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_ML_REDIRECT_URI;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });

    const url = `https://auth.mercadolivre.com.br/authorization?${params}`;
    window.location.href = url;
  }

  // Função de desconexão (placeholder)
  function handleDesconectar() {
    toast.info("Função de desconexão será implementada!");
  }

  // --- VISUAL ---
  if (loading) return <div>Carregando integração...</div>;

  // Estilo do card
  const cardStyle = {
    width: 240,
    minHeight: 210,
    background: "#f8fafc",
    border: "2px solid #e5e7eb",
    borderRadius: 18,
    padding: "28px 18px 16px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 2px 10px #3483fa11",
    margin: "8px",
    position: "relative",
  };

  const statusStyle = (ativo) => ({
    color: ativo ? "#14a800" : "#64748b",
    background: ativo ? "#e7ffe5" : "#f1f5f9",
    borderRadius: 6,
    fontWeight: "bold",
    padding: "2px 10px",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 10,
    display: "inline-block",
  });

  // Card Integrado
  if (integracao) {
    return (
      <div style={cardStyle}>
        <img src="/mercadolivre.png" alt="Mercado Livre" style={{ width: 46, marginBottom: 10 }} />
        <div style={{ fontWeight: 600, fontSize: 17, color: "#333", marginBottom: 2 }}>Mercado Livre</div>
        <span style={statusStyle(true)}>
          <span style={{ marginRight: 6 }}>🟢</span>
          Integração ativada
        </span>
        <div style={{ fontSize: 13, color: "#3c4252" }}>
          Conta: <b>{integracao.user_id_ml || "ID não informado"}</b>
        </div>
        <button
          style={{
            marginTop: 18,
            padding: "10px 0",
            width: "100%",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            letterSpacing: 1,
            boxShadow: "0 2px 4px #ef444455",
            transition: "background .2s",
          }}
          onClick={handleDesconectar}
          disabled
        >
          Desativar integração
        </button>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>Desconectar em breve!</div>
      </div>
    );
  }

  // Card NÃO integrado
  return (
    <div style={cardStyle}>
      <img src="/mercadolivre.png" alt="Mercado Livre" style={{ width: 46, marginBottom: 10 }} />
      <div style={{ fontWeight: 600, fontSize: 17, color: "#333", marginBottom: 2 }}>Mercado Livre</div>
      <span style={statusStyle(false)}>
        <span style={{ marginRight: 6 }}>⚪</span>
        Integração desativada
      </span>
      <button
        style={{
          marginTop: 18,
          padding: "10px 0",
          width: "100%",
          background: "#3483fa",
          color: "#fff",
          border: "none",
          borderRadius: 7,
          fontWeight: "bold",
          fontSize: 16,
          cursor: "pointer",
          letterSpacing: 1,
          boxShadow: "0 2px 4px #3483fa33",
          transition: "background .2s",
        }}
        onClick={handleConectar}
      >
        Ativar integração
      </button>
    </div>
  );
}
