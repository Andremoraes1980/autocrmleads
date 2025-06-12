import React from "react";
import Sidebar from "./Sidebar";
import HeaderUsuario from "./HeaderUsuario"; // 👈 importa o componente do avatar
import styles from "./Layout.module.css";

const Layout = ({ children }) => {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.content}>
        {/* Ícone do usuário fixo no canto superior direito */}
        <div className={styles.headerUserWrapper}>
          <HeaderUsuario />
        </div>

        {/* Conteúdo da página vem abaixo */}
        {children}
      </div>
    </div>
  );
};

export default Layout;
