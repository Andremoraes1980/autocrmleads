// src/components/BotaoReenvioAudioLottie.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BotaoReenvioAudioLottie({ onReenviar, enviado = false }) {
  const [status, setStatus] = useState(enviado ? "success" : "idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (enviado) {
      setStatus("success");
    }
  }, [enviado]);

  // Função para simular envio e progresso
  const handleClick = async () => {
    if (status !== "idle") return;
    setStatus("loading");
    setProgress(0);

    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 16;
      if (pct >= 100) {
        clearInterval(interval);
        setProgress(100);
        setStatus("success");
        
      } else {
        setProgress(Math.min(pct, 100));
      }
    }, 180);

    try {
      await onReenviar?.();
    } catch {
      clearInterval(interval);
      setStatus("idle");
      setProgress(0);
    }
  };

  // Parâmetros do círculo SVG
  const size = 45;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.button
      onClick={handleClick}
      disabled={status === "loading" || status === "success"}
      whileTap={status === "idle" ? { scale: 0.94 } : {}}
      style={{
        width: size,
        height: size,
        border: "none",
        outline: "none",
        borderRadius: "50%",
        background: "rgb(39, 174, 96)",
        boxShadow: "0 0 24px 0 #64b5f6cc",// Sempre igual
        position: "relative",
        cursor: status === "loading" ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        marginLeft: 14,
        transform: "scale(0.7)",
        transformOrigin: "center center",
      }}
      title="Reenviar áudio para iPhone"
    >
      {/* Progresso circular */}
      <svg
        width={size}
        height={size}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: "none"
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fff"
          strokeWidth={stroke}
          fill="none"
          opacity={0.25}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#19b2fa"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={status === "loading" ? offset : 0}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.22s linear"
          }}
          animate={{ strokeDashoffset: status === "loading" ? offset : 0 }}
        />
      </svg>

      {/* Ondas animadas */}
      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0.1, scale: 1.05 }}
            animate={{ opacity: 0.33, scale: 1.14 }}
            exit={{ opacity: 0, scale: 1.22 }}
            transition={{
              repeat: Infinity,
              repeatType: "mirror",
              duration: 1.18,
              ease: "easeInOut"
            }}
            style={{
              position: "absolute",
              top: -6,
              left: -6,
              width: size + 12,
              height: size + 12,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 50% 50%, #b3e5fc 40%, #2196f3 80%, #2196f300 98%)",
              zIndex: 0,
              pointerEvents: "none"
            }}
          />
        )}
      </AnimatePresence>

      {/* Ícone de celular e, no sucesso, check posicionado */}
      <span
  style={{
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  }}
>
  {/* Ícone celular sempre */}
  <svg
    width={size * 0.5}
    height={size * 0.5}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    

    style={{
      display: "block",
      margin: "0 auto",
      zIndex: 2,
    }}
  >
    <rect x="7" y="2" width="10" height="20" rx="3" />
    <circle cx="12" cy="18" r="1.3" />
  </svg>
  {/* Status progressivo */}
  {status === "loading" && (
    <span
      style={{
        position: "absolute",
        fontWeight: 600,
        fontSize: 16,
        color: "#fff",
        textShadow: "0 1px 3px #2196f3",
        marginTop: -1
      }}
    >
      {Math.round(progress)}%
    </span>
  )}
  {/* Check verde só se sucesso */}
  {status === "success" && (
    <motion.svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#eee"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        position: "absolute",
        bottom: -9,
        right: -3,
        zIndex: 5,
        strokewidth: 4.5
      }}
    >
      <polyline points="20 6 9 17 4 12" />
    </motion.svg>
  )}
</span>

    </motion.button>
  );
}
