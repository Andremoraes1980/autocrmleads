// Arquivo: backend/connections/socketProvider.js

const { io: ioClient } = require('socket.io-client');

console.log('🔌 [DEBUG] PROVIDER_SOCKET_URL =', process.env.PROVIDER_SOCKET_URL);
const socketProvider = ioClient(process.env.PROVIDER_SOCKET_URL, {
  transports: ["websocket", "polling"],
  secure: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
});

console.log('🐞 [DEBUG] PROVIDER_SOCKET_URL =', process.env.PROVIDER_SOCKET_URL);
console.log('🔌 Tentando conectar ao provider...');

// ✅ Conexão bem-sucedida
socketProvider.on('connect', () => {
  console.log('🟢 [DEBUG] socketProvider conectado — id:', socketProvider.id);
  console.log('🟢 Conectado ao provider do WhatsApp (AWS)');
  console.log("📡 socketProvider conectado?", socketProvider.connected);
});

// 🔴 Desconectado
socketProvider.on('disconnect', (reason) => {
  console.log('🔴 [DEBUG] socketProvider desconectado — motivo:', reason);
   console.log('🔴 Desconectado do provider do WhatsApp (AWS)');
});

socketProvider.on('connect_error', (err) => {
    console.error('❌ [DEBUG] socketProvider connect_error:', err.message);
   });

// ✅ Log genérico para qualquer evento emitido pelo provider
socketProvider.onAny((event, ...args) => {
  console.log('🐞 [DEBUG] socketProvider.onAny — evento:', event, args);
  console.log('📡 Evento recebido de provider:', event, args);
});

module.exports = socketProvider;
