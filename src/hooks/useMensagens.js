// src/hooks/useMensagens.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useMensagens(leadId, setMensagens, setEnviadosIphone) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_SOCKET_BACKEND_URL, {
        transports: ["websocket"],
        secure: true,
        reconnection: true,
      });

      socketRef.current.on("connect", () => {
        console.log("✅ Socket conectado:", socketRef.current.id);
      });
      socketRef.current.on("disconnect", reason => {
        console.warn("🔌 Socket desconectado:", reason);
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !leadId) return;

    console.log("🚀 Entrando na sala:", leadId);
    socket.emit("entrarNaSala", { lead_id: leadId });

    const handleMensagemRecebida = payload => {
      console.log("📩 [Front] mensagemRecebida:", payload);
      const msg = payload?.data ?? payload;
      if (!msg) return;

      setMensagens(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        next.sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
        return next;
      });
    };

    socket.off("mensagemRecebida");
    socket.on("mensagemRecebida", handleMensagemRecebida);

    return () => {
      socket.off("mensagemRecebida", handleMensagemRecebida);
      socket.emit("sairDaSala", { sala: `lead-${leadId}` });
    };
  }, [leadId]);
}
