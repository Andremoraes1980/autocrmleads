// backend/listeners/provider/receberMensagemV2.js
const buscarLeadIdPorTelefone = require('../../services/buscarLeadIdPorTelefone');

/**
 * Mantém o MESMO nome da função: receberMensagem
 * Agora ela registra o listener no socket do IO (provider -> backend)
 */
module.exports = function receberMensagem(socket, io) {
  // socket = conexão que acabou de entrar no seu backend (pode ser o provider)
  socket.on('mensagemRecebida', async (payload) => {
    console.log('🧪 [V2-IO] mensagemRecebida recebida via io:', payload);

    const { lead_id, telefone, mensagem } = payload || {};

    // 1) Se já veio com lead_id, repassa direto para a sala do front
    if (lead_id) {
      io.to(`lead-${lead_id}`).emit('mensagemRecebida', payload);
      console.log(`🧪 [V2-IO] emitido para sala lead-${lead_id}`);
      return;
    }

    // 2) Fallback por telefone
    const telefoneBusca =
      telefone || mensagem?.from || mensagem?.telefone || mensagem?.telefone_cliente;

    if (!telefoneBusca) {
      console.warn('🧪 [V2-IO] payload sem lead_id e sem telefone — não foi possível emitir.');
      return;
    }

    try {
      const leadIdBanco = await buscarLeadIdPorTelefone(telefoneBusca);
      if (leadIdBanco) {
        io.to(`lead-${leadIdBanco}`).emit('mensagemRecebida', { ...payload, lead_id: leadIdBanco });
        console.log(`🧪 [V2-IO] emitido por telefone para sala lead-${leadIdBanco}`);
      } else {
        console.warn('🧪 [V2-IO] telefone não localizado no banco:', telefoneBusca);
      }
    } catch (err) {
      console.error('🧪 [V2-IO] erro ao buscar lead por telefone:', err?.message || err);
    }
  });
};
