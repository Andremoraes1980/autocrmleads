// src/components/HeaderUsuario.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./HeaderUsuario.css";

export default function HeaderUsuario() {
  const navigate = useNavigate();
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const buscarUsuario = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        const user = data.user;
        const { data: usuarioDB } = await supabase
          .from("usuarios")
          .select("nome")
          .eq("id", user.id)
          .single();

        setUsuarioAtual({ ...user, nome: usuarioDB?.nome || null });
      }
    };
    buscarUsuario();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const formatarNome = (nome) => {
    if (!nome) return "Usuário";
    const partes = nome.trim().split(" ");
    const capitalizar = (str) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    return [capitalizar(partes[0]), capitalizar(partes[partes.length - 1])].join(" ");
  };

  const avatarLetter = (() => {
    const nome =
      usuarioAtual?.nome ||
      usuarioAtual?.user_metadata?.full_name ||
      (usuarioAtual?.email ? usuarioAtual.email.split("@")[0] : "");
    if (!nome) return "U";
    const partes = nome.trim().split(" ");
    return `${partes[0]?.[0]?.toUpperCase()}${partes.length > 1 ? partes[partes.length - 1]?.[0]?.toUpperCase() : ""}`;
  })();

  const userName = formatarNome(
    usuarioAtual?.nome ||
      usuarioAtual?.user_metadata?.full_name ||
      (usuarioAtual?.email ? usuarioAtual.email.split("@")[0] : "")
  );

  return (
    <div style={{ position: "relative" }}>
      <div
        className="user-avatar"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {avatarLetter}
      </div>
      {isDropdownOpen && (
        <div className="user-dropdown">
          <div className="user-name">{userName}</div>
          <div className="user-email">{usuarioAtual?.email}</div>
          <button onClick={() => navigate(`/usuario/${usuarioAtual?.id}`)}>
            Perfil
          </button>
          <button onClick={handleLogout}>Sair</button>
        </div>
      )}
    </div>
  );
}
