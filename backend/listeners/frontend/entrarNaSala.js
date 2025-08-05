// Arquivo: backend/listeners/frontend/entrarNaSala.js

module.exports = function entrarNaSala(socket) {
    socket.on('entrarNaSala', ({ lead_id }) => {
      if (!lead_id) {
        console.warn(`⚠️ Socket ${socket.id} tentou entrar sem lead_id`);
        return;
      }
  
      const room = `lead-${lead_id}`;
      socket.join(room);
      console.log(`👥 Socket ${socket.id} entrou na sala ${room}`);
  
      // ======= TESTE REAL‑TIME =========
      // setTimeout(() => {
      //   const pingMsg = {
      //     lead_id,
      //     mensagem: { id: 'ping', conteudo: '🚀 Teste real‑time!' }
      //   };
      //   io.to(room).emit('mensagemRecebida', pingMsg);
      //   console.log('✅ [TESTE] servidor emitiu mensagemRecebida de teste para', room);
      // }, 2000);
      // ==================================
    });
  };
  