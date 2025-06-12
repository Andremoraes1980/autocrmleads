// src/pages/Usuarios.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import UsuarioCard from "../components/UsuarioCard";
import styles from "./Usuarios.module.css";


const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao buscar usuários:", error);
    } else {
      setUsuarios(data);
    }
  };

  const ativarUsuario = async (id) => {
    const { error } = await supabase
      .from("usuarios")
      .update({ ativo: true })
      .eq("id", id);

    if (error) console.error("Erro ao ativar usuário:", error);
    else carregarUsuarios();
  };

  const inativarUsuario = async (id) => {
    const { error } = await supabase
      .from("usuarios")
      .update({ ativo: false })
      .eq("id", id);

    if (error) console.error("Erro ao inativar usuário:", error);
    else carregarUsuarios();
  };

  const excluirUsuario = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir este usuário?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) console.error("Erro ao excluir usuário:", error);
    else carregarUsuarios();
  };

  return (
    <Layout>
      <div className={styles.mainContainer}>
        <div className={styles.crmHeader}>
          <h2 className={styles.tituloHeader}>Usuários</h2>
        </div>

        <div className={styles.actionContainer}>
        <button onClick={() => navigate("/usuario/novo")}>
  Adicionar Usuário
</button>

        </div>

        <div className={styles.usuarioCardsContainer}>
          {usuarios.map((usuario) => (
            <UsuarioCard
              key={usuario.id}
              usuarios={usuario}
              onAtivar={ativarUsuario}
              onInativar={inativarUsuario}
              onExcluir={excluirUsuario}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Usuarios;
