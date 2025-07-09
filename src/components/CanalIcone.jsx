import React from "react";
import { Mail, MessageSquare } from "lucide-react";

// SVG customizado do WhatsApp com degradê, sombra e arredondado
const WhatsappIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="whatsapp-gradient" x1="0" y1="0" x2="0" y2="48">
        <stop offset="0%" stopColor="#25D366"/>
        <stop offset="100%" stopColor="#128C7E"/>
      </linearGradient>
      <filter id="whatsapp-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.18"/>
      </filter>
    </defs>
    <rect
      x="2"
      y="2"
      width="44"
      height="44"
      rx="12"
      fill="url(#whatsapp-gradient)"
      filter="url(#whatsapp-shadow)"
    />
    <path
      d="M34.003 28.347c-.577-.288-3.422-1.688-3.95-1.88-.529-.192-.913-.288-1.298.288-.385.577-1.489 1.88-1.825 2.267-.337.385-.673.385-1.25.096-.577-.288-2.438-.898-4.642-2.863-1.715-1.527-2.874-3.415-3.21-3.992-.337-.577-.036-.889.253-1.177.259-.256.577-.673.865-1.01.288-.336.385-.577.577-.962.192-.385.096-.721-.048-1.009-.144-.288-1.298-3.124-1.78-4.27-.471-1.123-.949-.963-1.298-.982-.336-.019-.721-.024-1.105-.024-.385 0-1.01.144-1.543.721-.529.577-2.025 1.98-2.025 4.828 0 2.849 2.073 5.605 2.363 5.998.289.385 4.085 6.24 9.884 8.116 1.382.444 2.458.71 3.298.905 1.384.322 2.646.276 3.644.168 1.112-.117 3.422-1.397 3.908-2.747.482-1.342.482-2.493.337-2.723-.144-.229-.529-.366-1.105-.654z"
      fill="#fff"
    />
  </svg>
);

export default function CanalIcone({ canal, size = 32 }) {
  // Definições de cores e sombras para cada canal
  const styles = {
    envelope: {
      color: "#FFD700", // dourado claro
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.10))"
    },
    chat: {
      color: "#D3D3D3", // cinza claro
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.10))"
    }
  };

  switch (canal) {
    case "whatsapp":
      return <WhatsappIcon size={size} />;
    case "email":
      return <Mail size={size} strokeWidth={1.5} style={styles.envelope} />;
    case "chat":
      return (
        <MessageSquare
          size={size}
          strokeWidth={1.5}
          style={{
            ...styles.chat,
            borderRadius: 8
          }}
        />
      );
    default:
      return null;
  }
}
