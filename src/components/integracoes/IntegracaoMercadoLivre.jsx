// src/components/integracoes/IntegracaoMercadoLivre.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "../components/ui/button"; // ou o caminho certo
import { toast } from "react-toastify";
import { LogOut, RefreshCw } from "lucide-react"; // opcional, para ícones

export default function IntegracaoMercadoLivre({ usuarioId, revendaId }) {
  const [integracao, setIntegracao] = useState(null);
  const [loading, setLoading] = useState(true);



  // 1. Ao carregar, busca integração
  useEffect(() => {
    async function buscarIntegracao() {
      const { data, error } = await supabase
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

  // 2. Renderização
  if (loading) return <div>Carregando integração Mercado Livre…</div>;

  if (integracao) {
    return (
      <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 10, background: "#f6fff7", marginBottom: 24 }}>
        <div style={{ color: "green", fontWeight: "bold", fontSize: 18, marginBottom: 4 }}>
          Mercado Livre já conectado!
        </div>
        <div>
          Conta ML: <b>{integracao.user_id_ml}</b>
        </div>
        <div style={{ marginTop: 10 }}>
          {/* Aqui pode colocar botões: */}
          <Button variant="secondary" onClick={() => toast.info("Função desconectar futura!")}>
            <LogOut size={16} style={{ marginRight: 6 }} /> Desconectar
          </Button>
          <Button variant="outline" style={{ marginLeft: 10 }} onClick={() => toast.info("Função renovar token futura!")}>
            <RefreshCw size={16} style={{ marginRight: 6 }} /> Renovar Token
          </Button>
        </div>
      </div>
    );
  }

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
  

  // Se não tem integração ativa, mostra botão de conectar
  return (
    // Novo:
<Button variant="default" onClick={handleConectar}>
  Conectar Mercado Livre
</Button>

  );
}
