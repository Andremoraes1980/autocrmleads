// src/components/automacoes/CardAutomacao.jsx

import React, { useState } from "react";


export default function CardAutomacao({
  statusColuna = "Sem Contato",
  nome = "Automação Exemplo",
  ativa = true,
  mensagens = [
    
  ],
  onToggleAtiva,
  onEditar,
  onExcluir,
  onTestar,
  onAdicionarMensagem,   // <-- ADICIONE ESTA LINHA
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e2e2",
        borderRadius: 16,
        background: "#fff",
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        padding: 24,
        position: "relative",
        minWidth: 320,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#313136",
            flex: 1,
          }}
        >
          {nome}
        </span>
        <span
          style={{
            background: "#f1f5f9",
            color: "#374151",
            fontWeight: 500,
            fontSize: 14,
            borderRadius: 8,
            padding: "3px 14px",
            marginRight: 8,
          }}
        >
          {statusColuna}
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={ativa}
            onChange={onToggleAtiva}
            style={{ accentColor: "#16a34a" }}
          />
          <span style={{ color: ativa ? "#16a34a" : "#ccc", fontWeight: 500 }}>
            {ativa ? "Ativo" : "Inativo"}
          </span>
        </label>
        <button onClick={onEditar} title="Editar" style={{ marginLeft: 12, border: "none", background: "transparent", cursor: "pointer", fontSize: 20 }}>
          ✏️
        </button>
        <button onClick={onExcluir} title="Excluir" style={{ marginLeft: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 20 }}>
          🗑️
        </button>
      </div>

      <div style={{ marginLeft: 10, marginTop: 12 }}>
      console.log("mensagens recebidas pelo CardAutomacao:", mensagens);

       {mensagens.map ((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
              background: "#f9fafb",
              borderRadius: 8,
              padding: "7px 12px",
            }}
          >
            {/* Farol de status */}
            <span
              style={{
                display: "inline-block",
                width: 15,
                height: 15,
                borderRadius: "50%",
                background:
                  msg.status === "pendente"
                    ? "#facc15" // amarelo
                    : msg.status === "executada"
                    ? "#16a34a" // verde
                    : "#dc2626", // vermelho
                marginRight: 8,
                border: "1px solid #e2e8f0",
              }}
              title={
                msg.status === "pendente"
                  ? "Agendado"
                  : msg.status === "executada"
                  ? "Enviado"
                  : "Erro"
              }
            ></span>
            <span style={{ fontSize: 15, color: msg.ativa ? "#222" : "#bbb" }}>
              {msg.texto}
            </span>
            <span style={{ color: "#888", fontSize: 14, marginLeft: "auto" }}>{msg.tempo}</span>
            <label style={{ marginLeft: 8, cursor: "pointer", fontSize: 14 }}>
              <input
                type="checkbox"
                checked={msg.ativa}
                style={{ accentColor: "#16a34a" }}
                readOnly
              />{" "}
              Ativa
            </label>
          </div>
           
           ))}

           {/* Adicione este botão AQUI */}
<button
  style={{
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "7px 18px",
    marginTop: 10,
    fontWeight: 500,
    cursor: "pointer"
  }}
  onClick={onAdicionarMensagem}
>
  + Mensagem
</button>
      </div>
    </div>
  );
}
