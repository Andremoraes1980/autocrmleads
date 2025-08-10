// Arquivo: backend/listeners/frontend/entrarNaSala.js

// backend/listeners/frontend/entrarNaSala.js
module.exports = function entrarNaSala(socket, io) {
  socket.on('entrarNaSala', ({ lead_id }) => {
    if (!lead_id) {
      console.warn(`⚠️ [IO] ${socket.id} tentou entrar sem lead_id`);
      return;
    }
    const room = `lead-${lead_id}`;
    socket.join(room);
    console.log(`👥 [IO] ${socket.id} entrou na sala ${room}`);
  });
};
