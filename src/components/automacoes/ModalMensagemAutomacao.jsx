import React, { useState } from "react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';



export default function ModalMensagemAutomacao({ open, onClose, onSalvar }) {
  const [texto, setTexto] = useState("");
  const [tempo, setTempo] = useState("");
  const [canais, setCanais] = useState([]); // Agora é um array!
  const [ativa, setAtiva] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [horario, setHorario] = useState("");
  const [templateSelecionado, setTemplateSelecionado] = useState("");
// Exemplo de mock dos templates aprovados, substitua pelo fetch real no futuro
const [templatesAprovados, setTemplatesAprovados] = useState([
  { id: "tpl1", nome: "Recuperação de contato" },
  { id: "tpl2", nome: "Nova Proposta" },
  { id: "tpl3", nome: "Acompanhamento" },
]);



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
    <Picker
      data={data}
      onEmojiSelect={(emoji) => setTexto(texto + (emoji.native || emoji.emoji))}
      locale="pt"
      previewPosition="none"
      theme="light"
      navPosition="top"
      maxFrequentRows={2}
      searchPosition="top"
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

        <label style={{ display: "block", marginTop: 18 }}>
  Template WhatsApp aprovado
  <select
    value={templateSelecionado}
    onChange={e => setTemplateSelecionado(e.target.value)}
    style={{
      width: "100%",
      padding: 8,
      borderRadius: 8,
      marginTop: 4,
      border: "1px solid #d1d5db",
      fontSize: 16,
    }}
  >
    <option value="">Selecione um template...</option>
    {templatesAprovados.map(tpl => (
      <option key={tpl.id} value={tpl.id}>
        {tpl.nome} {/* ou tpl.nomeExibicao */}
      </option>
    ))}
  </select>
</label>


        <label>
  Horário para disparo
  <input
    type="time"
    value={horario}
    onChange={e => setHorario(e.target.value)}
    style={{
      width: "120px",
      marginTop: 4,
      padding: 8,
      fontSize: 16,
      borderRadius: 8,
      border: "1px solid #d1d5db"
    }}
  />
</label>


<label>
  Canal de envio
  <div style={{ display: "flex", gap: 18, marginTop: 4 }}>
    <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <input
        type="checkbox"
        checked={canais.includes("chat")}
        onChange={e => {
          setCanais(prev =>
            e.target.checked
              ? [...prev, "chat"]
              : prev.filter(c => c !== "chat")
          );
        }}
      />
      Chat
    </label>
    <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <input
        type="checkbox"
        checked={canais.includes("whatsapp")}
        onChange={e => {
          setCanais(prev =>
            e.target.checked
              ? [...prev, "whatsapp"]
              : prev.filter(c => c !== "whatsapp")
          );
        }}
      />
      WhatsApp
    </label>
    <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <input
        type="checkbox"
        checked={canais.includes("email")}
        onChange={e => {
          setCanais(prev =>
            e.target.checked
              ? [...prev, "email"]
              : prev.filter(c => c !== "email")
          );
        }}
      />
      E-mail
    </label>
  </div>
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
              onSalvar({ texto, tempo, canais, ativa });
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
