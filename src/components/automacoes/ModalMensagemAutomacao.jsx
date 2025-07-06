import React, { useState } from "react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function ModalMensagemAutomacao({ open, onClose, onSalvar }) {
  const [texto, setTexto] = useState("");
  const [tempo, setTempo] = useState("");
  const [canal, setCanal] = useState("");
  const [ativa, setAtiva] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);

  // Lista dos placeholders personalizados
  const placeholders = [
    { label: "Nome do cliente", value: "{nome}" },
    { label: "Carro", value: "{carro}" },
    { label: "Link do anúncio", value: "{link}" },
    { label: "Instagram", value: "{instagram}" },
    { label: "Facebook", value: "{facebook}" },
    { label: "Estoque", value: "{estoque}" },
    { label: "Vendedor", value: "{vendedor}" },
    { label: "Loja", value: "{loja}" },
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
          padding: 36,
          borderRadius: 12,
          minWidth: 480,
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 18 }}>Nova Mensagem Automática</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label>
          Mensagem
          <div style={{ position: "relative", display: "flex", gap: 10 }}>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                minWidth: 380,
                marginTop: 4,
                padding: 10,
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                resize: "vertical"
              }}
              placeholder="Digite sua mensagem automática..."
            />
            {/* Botão Emoji */}
            <button
              type="button"
              style={{
                fontSize: 22,
                marginLeft: 4,
                border: showEmoji ? "2px solid #2563eb" : "1px solid #d1d5db",
                background: "#f3f4f6",
                borderRadius: 8,
                padding: "3px 8px",
                cursor: "pointer"
              }}
              onClick={() => setShowEmoji(!showEmoji)}
              title="Adicionar emoji"
              tabIndex={-1}
            >😃</button>
            {/* Emoji Picker */}
            {showEmoji && (
              <div style={{ position: "absolute", top: 38, right: 0, zIndex: 20 }}>
                <EmojiPicker
                  onEmojiClick={(emoji) => {
                    setTexto(texto + emoji.emoji);
                    setShowEmoji(false);
                  }}
                  autoFocusSearch={false}
                  width={320}
                  height={330}
                  theme="light"
                />
              </div>
            )}
          </div>
          {/* Botões dos placeholders */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
            {placeholders.map((ph) => (
              <button
                key={ph.value}
                type="button"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 22,
                  padding: "5px 14px",
                  fontSize: 14,
                  background: "#fafafa",
                  color: "#2563eb",
                  cursor: "pointer"
                }}
                onClick={() => setTexto(texto + " " + ph.value)}
                tabIndex={-1}
              >
                {ph.label}
              </button>
            ))}
          </div>
        </label>

<label>
  Horário para disparo
  <select
    value={tempo}
    onChange={e => setTempo(e.target.value)}
    style={{
      width: "120px",
      marginTop: 4,
      padding: 8,
      fontSize: 16,
      borderRadius: 8,
      border: "1px solid #d1d5db"
    }}
  >
    <option value="">Selecione...</option>
    <option value="08:00">08:00</option>
    <option value="09:00">09:00</option>
    <option value="10:00">10:00</option>
    <option value="11:00">11:00</option>
    <option value="12:00">12:00</option>
    <option value="13:00">13:00</option>
    <option value="14:00">14:00</option>
    <option value="15:00">15:00</option>
    <option value="16:00">16:00</option>
    <option value="17:00">17:00</option>
    <option value="18:00">18:00</option>
    <option value="19:00">19:00</option>
    <option value="20:00">20:00</option>
  </select>
</label>

          <label>
            Canal de envio
            <select
              value={canal}
              onChange={e => setCanal(e.target.value)}
              style={{
                width: "120px",
                marginTop: 4,
                padding: 8,
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #d1d5db"
              }}
            >
              <option value="">Selecione...</option>
              <option value="chat">Chat</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={ativa}
              onChange={e => setAtiva(e.target.checked)}
              style={{ accentColor: "#16a34a" }}
            />
            Ativa
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
            onClick={() => {
              onSalvar({ texto, tempo, canal, ativa });
            }}
            style={{
              background: "#3b82f6", color: "#fff", border: "none",
              padding: "8px 26px", borderRadius: 7, fontSize: 15, fontWeight: 600, marginLeft: 10
            }}
          >
            Salvar Mensagem
          </button>
        </div>
      </div>
    </div>
  );
}
