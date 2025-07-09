import React from "react";
import { Mail, MessageSquare } from "lucide-react";

// SVG WhatsApp igual ao oficial
const WhatsappIcon = ({ size = 32, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="wapp-gradient" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4EF381"/>
        <stop offset="1" stopColor="#1FA855"/>
      </linearGradient>
      <filter id="wapp-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.14"/>
      </filter>
    </defs>
    <rect
      x="4"
      y="4"
      width="40"
      height="40"
      rx="12"
      fill="url(#wapp-gradient)"
      filter="url(#wapp-shadow)"
    />
    <path
      d="M24 14.36c-5.3 0-9.61 4.21-9.61 9.41 0 1.66.47 3.28 1.29 4.7l-1.38 4.41 4.53-1.31a9.86 9.86 0 0 0 5.17 1.46c5.3 0 9.6-4.21 9.6-9.41s-4.3-9.41-9.6-9.41Zm5.55 12.53c-.24.66-1.36 1.27-1.87 1.36-.48.1-1.08.14-1.73-.11-.4-.14-.92-.3-1.59-.59-2.8-1.21-4.63-4.08-4.77-4.28-.14-.19-1.14-1.52-1.14-2.89 0-1.38.72-2.07.97-2.34.25-.27.54-.33.72-.33.18 0 .36.01.52.01.16 0 .4-.07.63.48.23.56.79 1.93.86 2.07.07.14.11.3.01.49-.1.19-.15.31-.3.48-.15.17-.32.38-.46.51-.15.13-.3.28-.13.55.17.27.76 1.25 1.62 2.03 1.11.98 2.04 1.29 2.31 1.43.27.14.42.12.57-.07.15-.19.65-.75.83-1.01.18-.26.35-.21.59-.13.24.08 1.53.72 1.79.85.26.13.43.2.49.31.06.1.06.61-.18 1.27Z"
      fill="#fff"
    />
  </svg>
);

export default function CanalIcone({ canal, size = 32 }) {
  // Definições de cores e sombras para cada canal
  const styles = {
    envelope: {
      color: "#FFD700",
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.10))",
      verticalAlign: "middle"
    },
    chat: {
      color: "#D3D3D3",
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.10))",
      verticalAlign: "middle"
    }
  };

  const tooltipMap = {
    whatsapp: "WhatsApp",
    email: "E-mail",
    chat: "Chat"
  };

  switch (canal) {
    case "whatsapp":
      return (
        <span title={tooltipMap[canal]}>
          <WhatsappIcon size={size} style={{ verticalAlign: "middle" }} />
        </span>
      );
    case "email":
      return (
        <span title={tooltipMap[canal]}>
          <Mail size={size} strokeWidth={1.5} style={styles.envelope} />
        </span>
      );
    case "chat":
      return (
        <span title={tooltipMap[canal]}>
          <MessageSquare size={size} strokeWidth={1.5} style={styles.chat} />
        </span>
      );
    default:
      return null;
  }
}
