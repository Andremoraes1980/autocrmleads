
// Arquivo: backend/listeners/provider/receberMensagem.js

const buscarLeadIdPorTelefone = require('../../services/buscarLeadIdPorTelefone');//aqui

module.exports = function receberMensagem(socketProvider, io) {
  console.log('🐛 [BACKEND] receberMensagem() chamado — listener vai ser registrado');
  socketProvider.on('mensagemRecebida', (payload) => {
    console.log('🐛 [BACKEND] 🚨 callback mensagemRecebida disparado', payload);
     console.log('📥 Recebido mensagemRecebida do provider:', payload);
    const { lead_id, telefone, mensagem } = payload;

    console.log('📥 [REPASSE] chegou mensagemRecebida do provider:', payload);
    console.log('🚦 [REPASSE] pronto para emitir na sala:', `lead-${lead_id}`);

    if (lead_id) {
      io.to(`lead-${lead_id}`).emit('mensagemRecebida', payload);
      console.log('✅ [REPASSE] emitido mensagemRecebida para sala lead-' + lead_id);
    } else {
      const telefoneBusca = telefone || mensagem?.from;
      if (telefoneBusca) {
        console.log('⚙️ [REPASSE] fallback por telefone:', telefoneBusca);
        buscarLeadIdPorTelefone(telefoneBusca)
          .then((leadIdBanco) => {
            if (leadIdBanco) {
              io.to(`lead-${leadIdBanco}`).emit('mensagemRecebida', { ...payload, lead_id: leadIdBanco });
              console.log(`✅ [REPASSE] emitido mensagemRecebida para sala lead-${leadIdBanco} (por telefone ${telefoneBusca})`);
            } else {
              console.warn('⚠️ Não foi possível identificar lead_id pelo telefone:', telefoneBusca);
            }
          })
          .catch((err) => {
            console.error('❌ Erro ao buscar lead_id pelo telefone:', err);
          });
      } else {
        console.warn('⚠️ Payload sem lead_id e sem telefone. Não foi possível emitir mensagem para sala específica.');
      }
    }
  });
};
