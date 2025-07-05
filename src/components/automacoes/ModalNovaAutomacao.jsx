import React, { useState } from "react";

export default function ModalNovaAutomacao({ open, onClose, onSalvar }) {
  const [nome, setNome] = useState("");
  const [statusColuna, setStatusColuna] = useState("");
  const [ativa, setAtiva] = useState(true);
  const [mensagens, setMensagens] = useState([
    {
      id: 1,
      texto: "",
      tempo: "",
      ativa: true,
    }
  ]);

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
            <input
              type="text"
              value={statusColuna}
              onChange={e => setStatusColuna(e.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                padding: 8,
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #d1d5db"
              }}
              placeholder="Ex: Sem Contato, Nova Proposta..."
            />
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

        <div style={{ marginTop: 28, marginBottom: 16, fontWeight: 500 }}>
          Mensagens agendadas <span style={{ fontSize: 13, color: "#888" }}>(pode adicionar várias)</span>
        </div>
        <div>
          {mensagens.map((msg, i) => (
            <div key={msg.id} style={{
              background: "#f3f4f6",
              borderRadius: 8,
              padding: 10,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <input
                type="text"
                value={msg.texto}
                onChange={e => {
                  const novas = mensagens.slice();
                  novas[i].texto = e.target.value;
                  setMensagens(novas);
                }}
                style={{ flex: 2, padding: 7, borderRadius: 7, border: "1px solid #ccc" }}
                placeholder="Mensagem a ser enviada (pode usar {{nome}}, {{veiculo}}...)"
              />
              <input
                type="text"
                value={msg.tempo}
                onChange={e => {
                  const novas = mensagens.slice();
                  novas[i].tempo = e.target.value;
                  setMensagens(novas);
                }}
                style={{ width: 70, padding: 7, borderRadius: 7, border: "1px solid #ccc" }}
                placeholder="Tempo"
              />
              <label>
                <input
                  type="checkbox"
                  checked={msg.ativa}
                  onChange={e => {
                    const novas = mensagens.slice();
                    novas[i].ativa = e.target.checked;
                    setMensagens(novas);
                  }}
                />
                Ativa
              </label>
              {mensagens.length > 1 && (
                <button
                  style={{
                    background: "none", border: "none", fontSize: 18, color: "#dc2626", cursor: "pointer"
                  }}
                  onClick={() => setMensagens(mensagens.filter((m, idx) => idx !== i))}
                  title="Remover mensagem"
                >×</button>
              )}
            </div>
          ))}
          <button
            style={{
              background: "#fbbf24", color: "#222", border: "none", borderRadius: 7,
              padding: "6px 14px", marginTop: 6, fontWeight: 500, cursor: "pointer"
            }}
            onClick={() =>
              setMensagens([...mensagens, { id: Date.now(), texto: "", tempo: "", ativa: true }])
            }
          >
            + Adicionar Mensagem
          </button>
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
            onClick={() => onSalvar({ nome, statusColuna, ativa, mensagens })}
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
