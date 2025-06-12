import React, { useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { FaRegClock } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import "./CardLead.css";


const CardLead = ({
    id,
    nome = "Nome",
    veiculo = "Corsa",
    temperaturaInicial = "frio",
    vendedorInicial = "",
    vendedorNome = "",
    vendedores = [],
    tempoDecorrido = 0,
    listeners = {},
    attributes = {},
    innerRef = null,
    isDragging = false,
    onTemperaturaChange = () => {},
    onVendedorChange = () => {},
    onAbrirModalVendedor = () => {},
    

}) => {
  const navigate = useNavigate();
  const [temperatura, setTemperatura] = useState(temperaturaInicial);
  const [vendedor, setVendedor] = useState(vendedorInicial);
  


  const formatarNome = (nomeCompleto) => {
    const palavras = nomeCompleto.trim().split(" ");
    const primeiro = palavras[0];
    const ultimo = palavras.length > 1 ? palavras[palavras.length - 1] : "";
    const capitalize = (str) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      

    return ultimo ? `${capitalize(primeiro)} ${capitalize(ultimo)}` : capitalize(primeiro);
  };

  const formatarTempo = (segundos) => {
    if (segundos < 60) return "Agora mesmo";
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `${minutos}m atrás`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h atrás`;
    const dias = Math.floor(horas / 24);
    return `${dias}d atrás`;
  };

  const coresTemperatura = {
    quente: "label-quente",
    morno: "label-morno",
    frio: "label-frio",
  };

  const temperaturas = ["frio", "morno", "quente"];

  const trocarTemperatura = (e) => {
    e.stopPropagation();
    const atual = temperaturas.indexOf(temperatura);
    const proxima = (atual + 1) % temperaturas.length;
    const novaTemperatura = temperaturas[proxima];
    setTemperatura(novaTemperatura);
    onTemperaturaChange(novaTemperatura);
  };

  const handleChangeVendedor = async (e) => {
    e.stopPropagation();
    const novoVendedor = e.target.value;
setVendedor(novoVendedor);
onVendedorChange(novoVendedor);

// Captura usuário atual (para garantir multi-loja)
const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");

// LOG para debug
console.log("🔄 Atualizando vendedor do lead:", id, "para loja:", usuarioAtual.revenda_id);

const { data, error } = await supabase
  .from("leads")
  .update({ vendedor_id: novoVendedor })
  .eq("id", id)
  .eq("revenda_id", usuarioAtual.revenda_id); // <-- Adicionado filtro de loja!

  
    if (error) {
      console.error("Erro ao atualizar vendedor:", error);
      alert("Erro ao atualizar vendedor.");
    }
  };
  

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isDragging) {
      navigate(`/conversa/${id}`);
    }
  };

  return (
    <div
      className={`card ${isDragging ? "dragging" : ""}`}
      ref={innerRef}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div className="card-title">
        {formatarNome(nome)}
        <div className="card-time">
          <FaRegClock style={{ marginRight: "4px" }} />
          {formatarTempo(tempoDecorrido)}
        </div>
      </div>

      <div className="dotted-rectangle">
  {/* Seção veículo + temperatura */}
  <div className="section">
    <div className="icon">🚗</div>
    <div className="text">{veiculo}</div>
    <div
      className={`temperatura-badge ${coresTemperatura[temperatura]}`}
      onClick={trocarTemperatura}
      style={{
        marginLeft: 8,
        cursor: "pointer",
        userSelect: "none",
        padding: "2px 10px",
        borderRadius: "12px",
        fontWeight: "bold",
        fontSize: "0.9em",
        minWidth: 60,
        textAlign: "center",
      }}
      title="Clique para trocar a temperatura"
    >
      {temperatura.toUpperCase()}
    </div>
  </div>

  {/* Seção vendedor */}
  <div className="section">
  <div className="icon">👤</div>
  <span
    className="text"
    style={{
      fontWeight: "bold",
      cursor: "pointer",
      textDecoration: "underline",
      fontSize: "1em",
      marginTop: "4px",
      display: "inline-block"
    }}
    title="Trocar vendedor"
    onClick={(e) => {
      e.stopPropagation();
      onAbrirModalVendedor({
        id,
        nome,
        veiculo,
        vendedor_id: vendedorInicial,
        vendedorNome,
        tempoDecorrido,
      });
    }}
  >
    {vendedorNome || "Adicionar"}
  </span>
</div>

</div>


      <div className="footer">
        <span>{formatarTempo(tempoDecorrido)}</span>
        <span>classificado</span>
      </div>
    </div>
  );
};

export default CardLead;

