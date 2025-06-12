// ModalUsuario.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "./ModalLead.css"; // Reaproveita os estilos existentes

function ModalUsuario({ visible, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    role: "vendedor",
  });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [visible]);

  if (!visible) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem({ tipo: "", texto: "" });

    const { nome, email, senha, role } = formData;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, role },
      },
    });

    if (signUpError) {
      setMensagem({ tipo: "erro", texto: "Erro ao criar usuário: " + signUpError.message });
      setLoading(false);
      return;
    }

    const userId = signUpData?.user?.id;
    if (!userId) {
      setMensagem({ tipo: "erro", texto: "Usuário criado, mas ID não retornado." });
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id: userId,
        nome,
        tipo: role,
        email,
      },
    ]);

    if (insertError) {
      setMensagem({ tipo: "erro", texto: "Erro ao salvar no banco: " + insertError.message });
      setLoading(false);
      return;
    }

    setMensagem({ tipo: "sucesso", texto: "Usuário cadastrado com sucesso!" });
    onCreate(signUpData.user);
    setFormData({ nome: "", email: "", senha: "", role: "vendedor" });

    setTimeout(() => {
      setMensagem({ tipo: "", texto: "" });
      onClose();
    }, 2000);

    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 style={{ marginBottom: "1rem" }}>Novo Usuário</h2>
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
            type="email"
            name="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="senha"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleChange}
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>

          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Criar"}
            </button>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
          </div>

          {mensagem.texto && (
            <p style={{ color: mensagem.tipo === "erro" ? "red" : "green", marginTop: 10 }}>
              {mensagem.texto}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ModalUsuario;
