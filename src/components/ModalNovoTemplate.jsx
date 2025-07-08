import React from "react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';


function ModalNovoTemplate({ aberto, onClose, onSalvar }) {
  const [nome, setNome] = React.useState("");
  const [conteudo, setConteudo] = React.useState("");
  const [canal, setCanal] = React.useState("whatsapp");
  const [showEmoji, setShowEmoji] = React.useState(false);


  async function handleSalvar() {
    if (!nome.trim() || !conteudo.trim()) {
      alert("Preencha todos os campos!");
      return;
    }
  
    try {
      const resp = await fetch("https://autocrm-backend.onrender.com/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          conteudo,
          status: "pendente" // ou outro status, se quiser permitir escolha
        }),
      });
      const data = await resp.json();
  
      if (!resp.ok) {
        alert("Erro ao salvar template: " + (data.error || "Erro desconhecido"));
        return;
      }
  
      // Chama o callback do pai passando o novo template salvo (com id do banco)
      if (onSalvar) onSalvar(data);
  
      setNome("");
      setConteudo("");
      setCanal("whatsapp");
      onClose();
  
    } catch (err) {
      alert("Erro de conexão ao salvar template!");
      console.error(err);
    }
  }
  

  if (!aberto) return null;
  return (
    <div
      style={{
        position: "fixed", left: 0, top: 0, width: "100%", height: "100%",
        background: "rgba(0,0,0,0.18)", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center"
      }}
    >
      <div style={{ background: "#fff", padding: 32, borderRadius: 14, width: 600, boxShadow: "0 6px 32px rgba(0,0,0,0.13)" }}>
        <h3 style={{ marginBottom: 18 }}>Novo Template de Mensagem</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 15 }}>Nome do Template</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            style={{ width: "97%", marginTop: 6, marginBottom: 12, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
                    
                    <label style={{ fontWeight: 600, fontSize: 15 }}>Conteúdo</label>
<div style={{ position: "relative", display: "flex", gap: 10 }}>
  <textarea
    rows={5}
    value={conteudo}
    onChange={e => setConteudo(e.target.value)}
    style={{
      width: "100%",
      minWidth: 320,
      marginTop: 4,
      padding: 10,
      fontSize: 16,
      borderRadius: 8,
      border: "1px solid #d1d5db",
      resize: "vertical"
    }}
    placeholder="Digite o conteúdo do template..."
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
        onEmojiSelect={emoji => setConteudo(conteudo + (emoji.native || emoji.emoji))}
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

{/* Placeholders (coloque logo abaixo do textarea) */}
<div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
  {[
    { label: "Nome do cliente", value: "{nome}" },
    { label: "Carro", value: "{carro}" },
    { label: "Link do anúncio", value: "{link}" },
    { label: "Instagram", value: "{instagram}" },
    { label: "Facebook", value: "{facebook}" },
    { label: "Estoque", value: "{estoque}" },
    { label: "Vendedor", value: "{vendedor}" },
    { label: "Loja", value: "{loja}" }
  ].map(ph => (
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
      onClick={() => setConteudo(conteudo + " " + ph.value)}
      tabIndex={-1}
    >
      {ph.label}
    </button>
  ))}
</div>


        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#eee" }}>Cancelar</button>
          <button onClick={handleSalvar} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 600 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default ModalNovoTemplate;
