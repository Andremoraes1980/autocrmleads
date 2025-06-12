import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./ModalLead.css";

function ModalLead({ visible, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    carro: "",
    temperatura: "Quente",
    origem: "",
  });

  if (!visible) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nome, telefone, carro, temperatura, origem } = formData;

    // Captura o usuário atual logado
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("Erro ao recuperar usuário:", userError);
      alert("Usuário não autenticado.");
      return;
    }

    const user = userData.user;

    // Recupera o usuário atual completo no localStorage para pegar o revenda_id
const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");

// Adiciona log para debug:
console.log("💡 Salvando lead para revenda:", usuarioLocal.revenda_id, "usuário:", user.id);

const { data: insertData, error } = await supabase
  .from("leads")
  .insert([{
    nome,
    telefone,
    veiculo: carro,
    temperatura: temperatura.toLowerCase(),
    origem,
    etapa: "Nova Proposta",
    vendedor_id: user.id,
    revenda_id: usuarioLocal.revenda_id, // <--- ADICIONADO!
  }])
  .select();



    if (error) {
      console.error("Erro ao salvar lead:", error);
      alert("Erro ao salvar lead.");
      return;
    }

    console.log("Lead salvo com sucesso:", insertData); // ✅ Debug inserção
    onCreate(insertData?.[0] || formData);
    onClose();

    // 🧽 Limpa os campos após submissão
    setFormData({
      nome: "",
      telefone: "",
      carro: "",
      temperatura: "Quente",
      origem: "",
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 style={{ marginBottom: "1rem" }}>Novo Lead</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nome"
            placeholder="Nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="telefone"
            placeholder="Telefone"
            value={formData.telefone}
            onChange={handleChange}
            pattern="[0-9]{10,11}" // 📞 Aceita apenas números com 10 ou 11 dígitos
            title="Informe um número válido com DDD (somente números)"
            required
          />
          <input
            type="text"
            name="carro"
            placeholder="Carro de Interesse"
            value={formData.carro}
            onChange={handleChange}
            required
          />
          <select
            name="temperatura"
            value={formData.temperatura}
            onChange={handleChange}
            required
          >
            <option value="Quente">Quente</option>
            <option value="Morno">Morno</option>
            <option value="Frio">Frio</option>
          </select>
          <select
            name="origem"
            value={formData.origem}
            onChange={handleChange}
            required
          >
            <option value="">Origem</option>
            <option value="Webmotors">Webmotors</option>
            <option value="Mercado Livre">Mercado Livre</option>
            <option value="OLX">OLX</option>
            <option value="iCarros">iCarros</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
          </select>

          <div className="modal-buttons">
            <button type="submit">Salvar</button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalLead;
