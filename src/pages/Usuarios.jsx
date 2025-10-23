// src/pages/Usuarios.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import UsuarioCard from "../components/UsuarioCard";
import styles from "./Usuarios.module.css";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [authUserId, setAuthUserId] = useState(null); // para bloquear excluir a si mesmo
  const navigate = useNavigate();

  useEffect(() => {
    // pega o id do usuário logado
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUserId(user?.id ?? null);
    });
    carregarUsuarios();

    // (opcional) realtime para atualizar sozinho quando alguém cria/edita
    const ch = supabase
      .channel("usuarios-lista")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usuarios" },
        () => carregarUsuarios(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const carregarUsuarios = async (marcarLoading = true) => {
    try {
      if (marcarLoading) setLoading(true);
      setErro(null);

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, tipo, ativo, revenda_id")
        .order("nome", { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (e) {
      console.error("Erro ao buscar usuários:", e);
      setErro(e?.message ?? "Falha ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const ativarUsuario = async (id) => {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: true })
        .eq("id", id);
      if (error) throw error;
      carregarUsuarios(false);
    } catch (e) {
      alert(`Erro ao ativar usuário: ${e?.message ?? "desconhecido"}`);
    }
  };

  const inativarUsuario = async (id) => {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: false })
        .eq("id", id);
      if (error) throw error;
      carregarUsuarios(false);
    } catch (e) {
      alert(`Erro ao inativar usuário: ${e?.message ?? "desconhecido"}`);
    }
  };

  const excluirUsuario = async (id) => {
    if (id === authUserId) {
      alert("Você não pode excluir o seu próprio usuário.");
      return;
    }

    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este usuário?"
    );
    if (!confirmar) return;

    try {
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (error) throw error;
      carregarUsuarios(false);
    } catch (e) {
      // Mostra a mensagem real do Supabase (ex.: FK antiga, RLS, etc.)
      alert(`Erro ao excluir usuário: ${e?.message ?? "desconhecido"}`);
    }
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

        {loading && <p>Carregando usuários…</p>}
        {erro && <p style={{ color: "tomato" }}>{erro}</p>}

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
          {!loading && usuarios.length === 0 && <p>Nenhum usuário encontrado.</p>}
        </div>
      </div>
    </Layout>
  );
};

export default Usuarios;
