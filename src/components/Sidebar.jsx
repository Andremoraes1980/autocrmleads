import React, { useState } from "react";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const navigate = useNavigate();

  // Recupera o usuário logado (se houver)
  const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");
  const ehAdmin = usuarioAtual?.tipo === "admin";

  const toggleSection = (section) => {
    if (!isExpanded) return;
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div
      className={`sidebar ${isExpanded ? "expanded" : ""}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setOpenSection(null);
      }}
    >
      <div className="menu-item" onClick={() => navigate("/")}>
        <i className="fas fa-home"></i>
        {isExpanded && <span className="menu-label">Início</span>}
      </div>

      <div className="menu-item" onClick={() => toggleSection("crm")}>
        <i className="fas fa-briefcase"></i>
        {isExpanded && <span className="menu-label">CRM</span>}
      </div>
      {isExpanded && openSection === "crm" && (
        <div className="submenu">
          <div className="submenu-item">Leads</div>
          <div className="submenu-item">Integrações</div>
          <div
  className="submenu-item"
  onClick={() => navigate("/configuracoes")}
>
  Configuração
</div>

        </div>
      )}

      <div className="menu-item" onClick={() => toggleSection("usuarios")}>
        <i className="fas fa-users"></i>
        {isExpanded && <span className="menu-label">Usuários</span>}
      </div>
      {isExpanded && openSection === "usuarios" && (
        <div className="submenu">
          <div
            className="submenu-item"
            onClick={() => navigate("/usuario/novo")}
          >
            Incluir Usuário
          </div>
          <div
            className="submenu-item"
            onClick={() => navigate("/usuarios")}
          >
            Gerenciar Usuários
          </div>
        </div>
      )}

      {/* ----------- MENU EXCLUSIVO ADMIN ----------- */}
      {ehAdmin && (
        <div
          className="menu-item"
          onClick={() => navigate("/frases-prontas")}
        >
          <i className="fas fa-comment-dots"></i>
          {isExpanded && <span className="menu-label">Frases Prontas</span>}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
