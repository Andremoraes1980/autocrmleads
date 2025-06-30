import React, { useState } from "react";

function BotaoIphone({ onClick, enviado }) {
  const [hover, setHover] = useState(false);
  const [ativo, setAtivo] = useState(enviado);

  const handleClick = async () => {
    setAtivo(true);
    if (onClick) await onClick();
  };

  return (
    <div
      style={{
        display: "inline-block",
        marginLeft: 12,
        position: "relative"
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={handleClick}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: ativo ? "#27ae60" : "#ededed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: ativo ? "not-allowed" : "pointer",
          transition: "background 0.2s"
        }}
        title=""
        disabled={ativo}
      >
        {/* Ícone de celular (SVG) */}
        <svg width="20" height="20" fill={ativo ? "#fff" : "#444"} viewBox="0 0 24 24">
          <path d="M7 2C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2H7ZM7 4H17V20H7V4ZM12 19C11.4477 19 11 18.5523 11 18C11 17.4477 11.4477 17 12 17C12.5523 17 13 17.4477 13 18C13 18.5523 12.5523 19 12 19Z" />
        </svg>
      </button>
      {/* Tooltip customizado */}
      {(hover || ativo) && (
        <div
          style={{
            position: "absolute",
            bottom: "-34px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#222",
            color: "#fff",
            padding: "3px 12px",
            borderRadius: 8,
            fontSize: 13,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10
          }}
        >
          {ativo ? "Enviado iPhone" : "Enviar áudio iPhone"}
        </div>
      )}
    </div>
  );
}

export default BotaoIphone;
