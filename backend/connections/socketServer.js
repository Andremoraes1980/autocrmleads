// backend/connections/socketServer.js
const { Server } = require('socket.io');

module.exports = function createSocketServer(server) {
  const io = new Server(server, {
    transports: ['websocket'],   // força WS (mais estável que polling)
    pingInterval: 20_000,        // combine com keepAliveTimeout do HTTP
    pingTimeout:  20_000,
    cors: {
      origin: [
        "https://autocrmleads.com.br",
        "https://www.autocrmleads.com.br",
        "https://autocrmleads.vercel.app",
        "http://localhost:5173"
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true
    }
  });

  console.log("🔧 [IO] socketServer inicializado");
  return io;
};
