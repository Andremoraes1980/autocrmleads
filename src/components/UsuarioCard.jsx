// src/components/UsuarioCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UsuarioCard.module.css";

export default function UsuarioCard({ usuarios, onInativar, onAtivar, onExcluir }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  const formatarNome = (texto) =>
    texto
      .toLowerCase()
      .split(" ")
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ");

  const toggleMenu = () => setMenuAberto(!menuAberto);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickFora = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const handleEditar = () => {
    navigate(`/usuario/${usuarios.id}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.usuarioLinha}>
          <span className={styles.usuarioIcon}>👤</span>
          <strong className={styles.usuarioNome}>
            {formatarNome(usuarios.nome)}
          </strong>
        </div>

        <div ref={menuRef} className={styles.menuContainer}>
          <button className={styles.menuButton} onClick={toggleMenu}>⋮</button>
          {menuAberto && (
            <div className={styles.dropdown}>
              <button onClick={handleEditar}>Editar</button>
              {usuarios.ativo ? (
                <button onClick={() => onInativar(usuarios.id)}>Inativar</button>
              ) : (
                <button onClick={() => onAtivar(usuarios.id)}>Ativar</button>
              )}
              <button onClick={() => onExcluir(usuarios.id)}>Excluir</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.usuarioInfo}>
        <p>{usuarios.email}</p>
        <small className={styles.tipoUsuario}>{usuarios.tipo}</small>
        <small className={styles.status}>
          {usuarios.ativo ? "Ativo" : "Inativo"}
        </small>
      </div>
    </div>
  );
}
