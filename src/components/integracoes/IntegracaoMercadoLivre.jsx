// src/components/integracoes/IntegracaoMercadoLivre.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "@/components/ui/button"; // ajuste se necessário
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

  // Se não tem integração ativa, mostra botão de conectar
  return (
    <Button variant="default" onClick={() => window.location.href = "/api/ml-auth"}>
      Conectar Mercado Livre
    </Button>
  );
}
