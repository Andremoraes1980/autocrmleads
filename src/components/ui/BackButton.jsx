// src/components/ui/BackButton.jsx
import { useNavigate } from "react-router-dom";

export default function BackButton({ to, label = "Voltar", style = {} }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => to ? navigate(to) : navigate(-1)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#f5f6fa",
        color: "#333",
        border: "none",
        borderRadius: 8,
        padding: "8px 18px",
        fontWeight: 600,
        fontSize: 16,
        cursor: "pointer",
        boxShadow: "0 2px 8px #0001",
        transition: "background 0.14s",
        ...style,
      }}
    >
      {/* Ícone de seta (você pode trocar por SVG de uma lib tipo Lucide ou Heroicons) */}
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      {label}
    </button>
  );
}
