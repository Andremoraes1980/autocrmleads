// backend/listeners/provider/receberMensagem.js
const buscarLeadIdPorTelefone = require('../../services/buscarLeadIdPorTelefone');

/**
 * Mantém o MESMO nome/função: receberMensagem
 * Agora ela registra o listener no socket do IO (onde o provider se conecta)
 */
module.exports = function receberMensagem(socket, io) {
  socket.on('mensagemRecebida', async (payload) => {
    console.log('📥 [IO] mensagemRecebida via io:', payload);

    const { lead_id, telefone, mensagem } = payload || {};

    if (lead_id) {
      io.to(`lead-${lead_id}`).emit('mensagemRecebida', payload);
      console.log(`✅ [REPASSE] emitido para sala lead-${lead_id}`);
      return;
    }

    // Fallback por telefone
    try {
      const tel =
        telefone || mensagem?.from || mensagem?.telefone || mensagem?.telefone_cliente;

      if (!tel) {
        console.warn('⚠️ [IO] payload sem lead_id e sem telefone — não foi possível emitir.');
        return;
      }

      const leadIdBanco = await buscarLeadIdPorTelefone(tel);
      if (leadIdBanco) {
        io.to(`lead-${leadIdBanco}`).emit('mensagemRecebida', { ...payload, lead_id: leadIdBanco });
        console.log(`✅ [REPASSE] emitido por telefone para sala lead-${leadIdBanco}`);
      } else {
        console.warn('⚠️ [IO] telefone não localizado no banco:', tel);
      }
    } catch (err) {
      console.error('❌ [IO] erro no fallback por telefone:', err?.message || err);
    }
  });
};
