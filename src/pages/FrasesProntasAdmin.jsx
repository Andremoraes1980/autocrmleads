import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import styles from "./EditarUsuario.module.css";
import { AlignCenter } from "lucide-react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';








const PLACEHOLDERS = [
  { label: "Nome do cliente", valor: "{cliente}" },
  { label: "Nome do vendedor", valor: "{vendedor}" },
  { label: "Veículo do lead", valor: "{veiculo}" },
  { label: "Endereço da loja", valor: "{endereco_loja}" },
  { label: "Telefone do cliente", valor: "{telefone_cliente}" },
  { label: "Link do anúncio", valor: "{link_veiculo}" },
  { label: "Nome da loja", valor: "{nome_loja}" },
  { label: "Telefone do vendedor", valor: "{telefone_vendedor}" }
];


export default function FrasesProntasAdmin() {
  const [frases, setFrases] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [tituloEditando, setTituloEditando] = useState("");
  const [mensagemEditando, setMensagemEditando] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [showEmojiPickerEdit, setShowEmojiPickerEdit] = useState(false);
const [erro, setErro] = useState("");
const [sucesso, setSucesso] = useState("");




  const textareaRef = useRef(null);

  // Carregar frases existentes
  useEffect(() => {
    async function fetchFrases() {
      const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");
      let query = supabase.from("frases_prontas").select("*");
      if (usuarioAtual.tipo !== "superadmin") {
        query = query.eq("revenda_id", usuarioAtual.revenda_id);
        console.log("🟢 [fetchFrases] Filtro por revenda_id:", usuarioAtual.revenda_id);
      } else {
        console.log("🔵 [fetchFrases] Superadmin: sem filtro por revenda_id");
      }
      const { data } = await query;
      setFrases(data || []);
    }
    fetchFrases();
  }, []);
  

  // Adicionar nova frase
  async function adicionarFrase() {
    console.log("➡️ Clique no botão ADICIONAR");
    if (!titulo.trim()) {
      setErro("⚠️ Por favor, preencha o campo 'Título da mensagem'.");
      return;
    }
    if (!mensagem.trim()) {
      setErro("⚠️ Por favor, preencha o campo de mensagem.");
      return;
    }
    setErro(""); // limpa o erro se passou nas validações
    
    const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");
    console.log("🔸 usuarioAtual:", usuarioAtual);
  
    try {
      // insere e já devolve o registro inserido
      console.log("💡 Inserindo frase pronta para revenda:", usuarioAtual.revenda_id, "usuário:", usuarioAtual.id);

const { data, error } = await supabase
  .from("frases_prontas")
  .insert(
    [{
      titulo,
      texto_frase: mensagem,
      usuario_id: usuarioAtual.id,
      revenda_id: usuarioAtual.revenda_id,
    }],
    { returning: "representation" }
  );


      console.log("🟢 Resultado do insert:", { data, error });
  
      if (error) {
        console.error("❌ Erro ao adicionar frase pronta:", error);
        alert("Erro ao adicionar frase: " + error.message);
        return;
      }
  
      setTitulo("");
setMensagem("");
setSucesso("✅ Frase criada com sucesso!");
setErro("");

// Atualiza a lista puxando do banco novamente, garantindo ordem correta!
const { data: novasFrases, error: erroBusca } = await supabase
  .from("frases_prontas")
  .select("*");
if (!erroBusca) {
  setFrases(novasFrases || []);
}

// Limpa o sucesso após 2 segundos
setTimeout(() => setSucesso(""), 2000);

      
    } catch (err) {
      console.error("🚨 Erro inesperado:", err);
    }
  }
  

  function inserirEmoji(emoji, modoEdicao = false) {
    const ref = modoEdicao ? textareaEditRef : textareaRef;
    const valorEmoji = emoji.native || emoji;
    if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      if (modoEdicao) {
        setMensagemEditando(
          mensagemEditando.slice(0, start) + valorEmoji + mensagemEditando.slice(end)
        );
        setTimeout(() => {
          ref.current.focus();
          ref.current.selectionStart = ref.current.selectionEnd = start + valor.length;
        }, 1);
        
      } else {
        setMensagem(
          mensagem.slice(0, start) + valorEmoji + mensagem.slice(end)
        );
        setTimeout(() => {
          ref.current.focus();
          ref.current.selectionStart = ref.current.selectionEnd = start + valor.length;
        }, 1);
        
      }
    }
  }
  

  // Iniciar edição
  function editarFrase(id, t, m) {
    setEditandoId(id);
    setTituloEditando(t);
    setMensagemEditando(m);
  }

  // Salvar edição
  async function salvarEdicao() {
    if (!tituloEditando.trim() || !mensagemEditando.trim()) return;
    const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");
const { error } = await supabase
  .from("frases_prontas")
  console.log("📝 Atualizando frase pronta id:", editandoId, "para revenda:", usuarioAtual.revenda_id);

  update({ titulo: tituloEditando, texto_frase: mensagemEditando })
  .eq("id", editandoId)
  .eq("revenda_id", usuarioAtual.revenda_id); // <--- ADICIONADO

    if (!error) {
      setFrases((prev) =>
        prev.map((fp) =>
          fp.id === editandoId
            ? { ...fp, titulo: tituloEditando, texto_frase: mensagemEditando }
            : fp
        )
      );
      setEditandoId(null);
      setTituloEditando("");
      setMensagemEditando("");
    }
  }

  // Excluir frase
  async function removerFrase(id) {
    const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");
await supabase.from("frases_prontas").delete()
  .eq("id", id)
  .eq("revenda_id", usuarioAtual.revenda_id); // <--- ADICIONADO
console.log("🗑️ Excluindo frase pronta id:", id, "revenda:", usuarioAtual.revenda_id);
setFrases((prev) => prev.filter((fp) => fp.id !== id));

  }

  // Insere placeholder no textarea (respeitando posição do cursor)
  function inserirPlaceholder(valor, modoEdicao = false) {
    const ref = modoEdicao ? textareaEditRef : textareaRef;
    if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      if (modoEdicao) {
        setMensagemEditando(
          mensagemEditando.slice(0, start) + valor + mensagemEditando.slice(end)
        );
        setTimeout(() => {
          ref.current.focus();
          ref.current.selectionStart = ref.current.selectionEnd = start + valor.length;
        }, 1);
        
      } else {
        setMensagem(
          mensagem.slice(0, start) + valor + mensagem.slice(end)
        );
        setTimeout(() => {
          ref.current.focus();
          ref.current.selectionStart = ref.current.selectionEnd = start + valor.length;
        }, 1);
        
      }
    } else {
      modoEdicao
        ? setMensagemEditando(mensagemEditando + valor)
        : setMensagem(mensagem + valor);
    }
  }

  const textareaEditRef = useRef(null);

  return (
    <Layout>
      <div className={styles.scrollWrapper}>
        <div className={styles.header}>
          <h2>Frases Prontas</h2>
        </div>

        <div className={styles.container}>
          <h3 className={styles.subtitulo}>Criar nova mensagem pronta</h3>
          <div style={{ marginBottom: 12 }}>
          {erro && (
  <div style={{ color: "#c00", fontWeight: 600, margin: "8px 0", textAlign: "center" }}>
    {erro}
  </div>
)}
{sucesso && (
  <div style={{ color: "#009900", fontWeight: 600, margin: "8px 0", textAlign: "center" }}>
    {sucesso}
  </div>
)}

            <input
              style={{
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                width: "70%",
                marginBottom: 12,
                fontWeight: "bold",
                margin: "0 auto",
                display: "block"
              }}
              
              placeholder="Título da mensagem"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />
            <br />
            <div style={{ position: 'relative', width: '70%', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
  <textarea
    ref={textareaRef}
    style={{
      width: "100%",
      minHeight: 60,
      borderRadius: 4,
      border: "1px solid #ccc",
      padding: 8,
      fontSize: 16,
      marginBottom: 10,
      resize: "vertical"
    }}
    rows={3}
    placeholder="Digite a mensagem pronta. Ex: Olá {cliente}, sou {vendedor}..."
    value={mensagem}
    onChange={e => setMensagem(e.target.value)}
  />
  <button
    type="button"
    onClick={() => setShowEmojiPicker(v => !v)}
    style={{ marginLeft: 8, fontSize: 22, cursor: "pointer" }}
    title="Adicionar emoji"
  >😀</button>
  {showEmojiPicker && (
  <div style={{ position: "absolute", top: 70, right: 0, zIndex: 10 }}>
    <Picker
      data={data}
      onEmojiSelect={emoji => {
        inserirEmoji(emoji, false);
        setShowEmojiPicker(false);
      }}
      locale="pt"
      previewPosition="none"
    />
  </div>
)}

</div>

            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, textAlign: "center", display: "block", margintop: 10 }}>Personalize com variáveis:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, width: "70%", margin: "0 auto", margintop: "10"  }}>
                {PLACEHOLDERS.map(ph => (
                  <button
                    key={ph.valor}
                    type="button"
                    style={{
                      padding: "5px 12px",
                      background: "#f1f1f1",
                      border: "1px solid #bbb",
                      borderRadius: 14,
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                    onClick={() => inserirPlaceholder(ph.valor)}
                  >
                    {ph.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className={styles.btnSalvar}
              type="button"
              onClick={adicionarFrase}
            >
              Adicionar
            </button>
          </div>
          <hr />
          <h3 className={styles.subtitulo}>Mensagens prontas cadastradas</h3>
          <ul style={{ padding: 0 }}>
            {frases.map(fp => (
              <li
                key={fp.id}
                style={{
                  marginBottom: 18,
                  background: "#fafbfc",
                  padding: 14,
                  borderRadius: 8,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 7
                }}
              >
                {editandoId === fp.id ? (
                  <>
                    <input
                      style={{
                        fontWeight: "bold",
                        marginBottom: 6,
                        padding: 8,
                        borderRadius: 4,
                        border: "1px solid #aaa",
                      }}
                      value={tituloEditando}
                      onChange={e => setTituloEditando(e.target.value)}
                    />
                    <div style={{ position: 'relative', width: '70%', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
  <textarea
    ref={textareaRef}
    style={{
      width: "100%",
      minHeight: 60,
      borderRadius: 4,
      border: "1px solid #ccc",
      padding: 8,
      fontSize: 16,
      marginBottom: 10,
      resize: "vertical"
    }}
    rows={3}
    placeholder="Digite a mensagem pronta. Ex: Olá {cliente}, sou {vendedor}..."
    value={mensagem}
    onChange={e => setMensagem(e.target.value)}
  />
</div>


                    <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {PLACEHOLDERS.map(ph => (
                        <button
                          key={ph.valor}
                          type="button"
                          style={{
                            padding: "5px 12px",
                            background: "#f1f1f1",
                            border: "1px solid #bbb",
                            borderRadius: 14,
                            fontSize: 14,
                            cursor: "pointer"
                          }}
                          onClick={() => inserirPlaceholder(ph.valor, true)}
                        >
                          {ph.label}
                        </button>
                      ))}
                    </div>
                    <div>
                      <button
                        className={styles.btnSalvar}
                        style={{ padding: "6px 14px", minWidth: 0, marginRight: 6 }}
                        onClick={salvarEdicao}
                      >
                        Salvar
                      </button>
                      <button
                        className={styles.btnSalvar}
                        style={{
                          background: "#eee",
                          color: "#888",
                          border: "none",
                          marginLeft: 4,
                          padding: "6px 14px",
                          minWidth: 0,
                        }}
                        onClick={() => setEditandoId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 16 }}>{fp.titulo || "Sem título"}</div>
                      <div style={{ color: "#333", fontSize: 15, margin: "2px 0 0 0" }}>
                        {fp.texto_frase}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className={styles.btnSalvar}
                        style={{ padding: "6px 14px", minWidth: 0 }}
                        onClick={() => editarFrase(fp.id, fp.titulo, fp.texto_frase)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.btnSalvar}
                        style={{
                          background: "#fff0f0",
                          color: "#c00",
                          border: "1px solid #f88",
                          minWidth: 0,
                        }}
                        onClick={() => removerFrase(fp.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
