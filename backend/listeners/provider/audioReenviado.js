// Arquivo: backend/listeners/provider/audioReenviado.js

module.exports = function audioReenviado(socketProvider, io) {
    socketProvider.on('audioReenviado', (payload) => {
      console.log('🔊 Recebido audioReenviado do provider:', payload);
      io.emit('audioReenviado', payload);
    });
  };
  