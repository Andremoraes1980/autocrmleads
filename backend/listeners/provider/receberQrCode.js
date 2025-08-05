// Arquivo: backend/listeners/provider/receberQrCode.js

const QRCode = require('qrcode');

module.exports = function receberQrCode(socketProvider, io) {
  socketProvider.on('qrCode', (data) => {
    console.log("📷 Payload do QR recebido do provider:", data);

    const qrString = typeof data === 'string' ? data : data?.qr;

    if (!qrString) {
      console.error('❌ QR inválido recebido:', data);
      return;
    }

    QRCode.toDataURL(qrString)
      .then(url => {
        console.log('✅ DataURL gerado do QR:', url.slice(0, 30) + '…');
        io.emit('qrCode', { qr: url }); // Envia para TODOS os frontends conectados
      })
      .catch(err => {
        console.error('❌ Erro ao gerar DataURL do QR:', err);
      });
  });
};
