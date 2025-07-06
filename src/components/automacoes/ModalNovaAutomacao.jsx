import React, { useState } from "react";

export default function ModalNovaAutomacao({ open, onClose, onSalvar }) {
  const [nome, setNome] = useState("");
  const [statusColuna, setStatusColuna] = useState("");
  const [ativa, setAtiva] = useState(true);

  // Ao salvar nova automação
async function salvarAutomacao(dados) {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const resp = await fetch("https://autocrm-backend.onrender.com/api/automacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dados, revenda_id: usuario.revenda_id })
    });
    const nova = await resp.json();
    setAutomacoes(prev => [nova, ...prev]);
  } catch (err) {
    console.error("Erro ao salvar automação:", err);
    alert("Erro ao salvar automação!");
  }
}


  const colunasStatus = [
    { value: "nova_proposta", label: "Nova Proposta" },
    { value: "nao_respondido", label: "Não Respondido" },
    { value: "visita_agendada", label: "Visita Agendada" },
    { value: "negociacao", label: "Negociação" },
    { value: "sem_contato", label: "Sem Contato" },
    { value: "vendido", label: "Vendido" },
    { value: "perdido", label: "Perdido" }    
    

  ];
  

  

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.18)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: 38,
          borderRadius: 12,
          minWidth: 380,
          minHeight: 320,
          boxShadow: "0 4px 24px rgba(0,0,0,0.16)",
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 22 }}>Nova Automação</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <label>
            Nome da Automação
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                padding: 8,
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #d1d5db"
              }}
              placeholder="Ex: Boas-vindas Sem Contato"
            />
          </label>
          <label>
  Coluna/Status de disparo
  <select
    value={statusColuna}
    onChange={e => setStatusColuna(e.target.value)}
    style={{
      width: "220px",
      marginTop: 4,
      padding: 8,
      fontSize: 16,
      borderRadius: 8,
      border: "1px solid #d1d5db"
    }}
  >
    <option value="">Selecione...</option>
    <option value="nova_proposta">Nova Proposta</option>
    <option value="nao_respondido">Não Respondido</option>
    <option value="visita_agendada">Visita Agendada</option>
    <option value="negociacao">Negociação</option>
    <option value="sem_contato">Sem Contato</option>
    <option value="vendido">Vendido</option>
    <option value="perdido">Perdido</option>
    
    
    <option value="vendido">Vendido</option>
  </select>
</label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <input
              type="checkbox"
              checked={ativa}
              onChange={e => setAtiva(e.target.checked)}
              style={{ accentColor: "#16a34a" }}
            />
            Ativar automação imediatamente
          </label>
        </div>

        
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 18, marginTop: 32 }}>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6", color: "#555", border: "none",
              padding: "8px 22px", borderRadius: 7, fontSize: 15, fontWeight: 500
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSalvar({ nome, statusColuna, ativa, })}

            style={{
              background: "#16a34a", color: "#fff", border: "none",
              padding: "8px 26px", borderRadius: 7, fontSize: 15, fontWeight: 600, marginLeft: 10
            }}
          >
            Salvar Automação
          </button>
        </div>
      </div>
    </div>
  );
}
