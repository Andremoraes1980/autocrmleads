import React, { useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { FaRegClock } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import "./CardLead.css";

const LOGOS_CLASSIFICADOS = {
  olx: "/olx.png",
  "mercado livre": "/mercadolivre.png",
  webmotors: "/webmotors.png",
  icarros: "/icarros.png",
  // outros se quiser...
};



const CardLead = ({
    id,
    nome = "Nome",
    veiculo = "Corsa",
    temperaturaInicial = "frio",
    vendedorInicial = "",
    vendedorNome = "",
    vendedores = [],
    tempoDecorrido = 0,
    imagem = "",
    origem = "",
    listeners = {},
    attributes = {},
    innerRef = null,
    isDragging = false,
    onTemperaturaChange = () => {},
    onVendedorChange = () => {},
    onAbrirModalVendedor = () => {},
    tempoMsgCliente = null, // <-- ADICIONE ESTA LINHA
    

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
    if (minutos < 60) return `${minutos} m atrás`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas} h atrás`;
    const dias = Math.floor(horas / 24);
    return `${dias}dias atrás`;
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
        <div className="card-time" style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <FaRegClock style={{ marginRight: "4px" }} />
  {tempoMsgCliente != null && (
    <span style={{
      background: 'rgb(227,165,165)',
      color: "#b91c1c",
      borderRadius: 14,
      fontWeight: 600,
      fontSize: 9,
      padding: "2px 10px",
      marginLeft: 4,
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
      display: "inline-block"
    }}>
      {tempoMsgCliente < 3600
        ? `${Math.floor(tempoMsgCliente / 60)} min Sem Retorno`
        : `${Math.floor(tempoMsgCliente / 3600)} h Sem Retorno`
      }
    </span>
  )}
</div>


      </div>

      <div className="dotted-rectangle">
  {/* Seção veículo + temperatura */}
  <div className="section">
  <div className="icon">
  {imagem ? (
    <img
      src={imagem}
      alt="Foto do veículo"
      style={{
        width: 36,
        height: 36,
        objectFit: "cover",
        borderRadius: "50%",
        border: "2px solid #eee",
        background: "#fff"
      }}
    />
  ) : (
    "🚗"
  )}
</div>

    <div className="text">{veiculo}</div>
    
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
      display: "inline-block",
      marginleft:"-32"
      
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
        textAlign: "center",
      }}
      title="Clique para trocar a temperatura"
    >
      {temperatura.toUpperCase()}
    </div>
</div>



</div>


<div className="footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <span>{formatarTempo(tempoDecorrido)}</span>
  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
    {LOGOS_CLASSIFICADOS[origem?.toLowerCase()] && (
      <img
        src={LOGOS_CLASSIFICADOS[origem.toLowerCase()]}
        alt={origem}
        style={{ width: 17, height: 17, borderRadius: "50%", background: "#fff", border: "1px solid #eee", marginRight: 3 }}
      />
    )}
    <span style={{ fontWeight: 500 }}>
      {origem ? origem.charAt(0).toUpperCase() + origem.slice(1) : "Classificado"}
    </span>
  </div>
</div>

    </div>
  );
};

export default CardLead;

