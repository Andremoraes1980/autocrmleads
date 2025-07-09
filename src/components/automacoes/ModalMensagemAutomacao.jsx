import React, { useEffect, useState } from "react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';



export default function ModalMensagemAutomacao({ open, onClose, onSalvar, automacao_id, mensagemParaEditar }) {

  const [texto, setTexto] = useState("");
  const [tempo, setTempo] = useState("");
  const [canais, setCanais] = useState([]); // Agora é um array!
  const [ativa, setAtiva] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [horario, setHorario] = useState("");
  const [templateSelecionado, setTemplateSelecionado] = useState("");
  const [templateId, setTemplateId] = useState(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (mensagemParaEditar) {
      setTexto(mensagemParaEditar.texto || "");
      setTempo(mensagemParaEditar.tempo || "");
      setCanais(Array.isArray(mensagemParaEditar.canais) ? mensagemParaEditar.canais : []); // para múltiplo
      setAtiva(mensagemParaEditar.ativa !== undefined ? mensagemParaEditar.ativa : true);
      setHorario(mensagemParaEditar.horario || "");
      setTemplateSelecionado(mensagemParaEditar.template_id || "");
      setTemplateId(mensagemParaEditar.template_id || null);
    } else {
      setTexto("");
      setTempo("");
      setCanais([]);
      setAtiva(true);
      setHorario("");
      setTemplateSelecionado("");
      setTemplateId(null);
    }
  }, [mensagemParaEditar]);
  

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const resp = await fetch("https://autocrm-backend.onrender.com/api/templates?status=aprovado");
        const lista = await resp.json();
        setTemplates(lista);
      } catch (err) {
        console.error("Erro ao buscar templates:", err);
        setTemplates([]); // fallback para lista vazia
      }
    }
    if (open) { // só busca quando modal abrir
      fetchTemplates();
    }
  }, [open]);
  
  


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

  // ... aqui vão seus imports, states, etc

const handleSalvarMensagem = async () => {
  const novaMensagem = {
    texto,
    template_id: templateId || null,
    canais,
    horario,
    ativa,
    ordem: 1,
    automacao_id,
    // outros campos...
  };

  try {
    const resp = await fetch("https://autocrm-backend.onrender.com/api/automacoes-mensagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaMensagem)
    });
    const salvo = await resp.json();
    onSalvar(salvo);
    onClose();
  } catch (err) {
    alert("Erro ao salvar mensagem automática!");
    console.error(err);
  }
};




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

        <label>
  Template aprovado (opcional)
  <select
    value={templateId || ""}
    onChange={e => setTemplateId(e.target.value || null)}
    style={{
      width: "100%",
      marginTop: 4,
      padding: 8,
      fontSize: 16,
      borderRadius: 8,
      border: "1px solid #d1d5db"
    }}
  >
    <option value="">Selecione um template...</option>
    {(Array.isArray(templates) ? templates : []).map(tmp => (
    <option value={tmp.id} key={tmp.id}>{tmp.nome}</option>
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
            onClick={handleSalvarMensagem}
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
