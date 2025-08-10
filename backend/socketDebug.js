// backend/socketDebug.js

const { io } = require('socket.io-client');

const socketProvider = ioClient(
    process.env.PROVIDER_SOCKET_URL || 'wss://socket.autocrmleads.com.br',
    {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 5000,
      secure: true,
    }
  );
  

socketProvider.on('connect', () => {
  console.log('[SOCKET DEBUG] Backend conectado ao provider!');
});

socketProvider.on('disconnect', () => {
    
  console.log('[SOCKET DEBUG] Backend desconectado do provider!');
});

socketProvider.on('mensagemRecebida', (payload) => {
  console.log('[SOCKET DEBUG] mensagemRecebida chegou no backend:', payload);
});

socketProvider.onAny((event, ...args) => {
  console.log('[SOCKET DEBUG] Evento genérico:', event, args);
});
