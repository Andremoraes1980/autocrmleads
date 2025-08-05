// Arquivo: backend/connections/socketProvider.js

const { io: ioClient } = require('socket.io-client');

const socketProvider = ioClient(process.env.PROVIDER_SOCKET_URL, {
  transports: ["websocket", "polling"],
  secure: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
});

console.log('🔌 Tentando conectar ao provider...');

// ✅ Conexão bem-sucedida
socketProvider.on('connect', () => {
  console.log('🟢 Conectado ao provider do WhatsApp (AWS)');
  console.log("📡 socketProvider conectado?", socketProvider.connected);
});

// 🔴 Desconectado
socketProvider.on('disconnect', () => {
  console.log('🔴 Desconectado do provider do WhatsApp (AWS)');
});

// ✅ Log genérico para qualquer evento emitido pelo provider
socketProvider.onAny((event, ...args) => {
  console.log('📡 Evento recebido de provider:', event, args);
});

module.exports = socketProvider;
