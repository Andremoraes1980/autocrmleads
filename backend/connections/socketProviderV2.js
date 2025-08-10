// backend/connections/socketProviderV2.js
const { io } = require('socket.io-client');

const URL = process.env.PROVIDER_SOCKET_URL || 'wss://socket.autocrmleads.com.br';
console.log('🧪 [V2] PROVIDER_SOCKET_URL =', URL);

const socketProvider = io(URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
  secure: true,
});

socketProvider.on('connect', () => {
  console.log('🧪 [V2] socketProvider conectado — id:', socketProvider.id);
});

socketProvider.on('disconnect', (reason) => {
  console.log('🧪 [V2] socketProvider desconectado — motivo:', reason);
});

socketProvider.on('connect_error', (err) => {
  console.error('🧪 [V2] socketProvider connect_error:', err.message);
});

// Log geral de tudo que vier do provider (para diagnóstico)
socketProvider.onAny((event, ...args) => {
  console.log('🧪 [V2] socketProvider.onAny — evento:', event, args?.[0]);
});

module.exports = socketProvider;
