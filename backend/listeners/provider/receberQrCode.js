// backend/listeners/provider/receberQrCode.js
const QRCode = require('qrcode');

module.exports = function receberQrCode(socketProvider, io, ultimoQrRef = { value: null }) {
  // evita registrar mais de uma vez
  if (socketProvider.__qrHandler) {
    socketProvider.off?.('qrCode', socketProvider.__qrHandler);
  }

  const handler = async (data = {}) => {
    try {
      console.log('📷 Payload do QR recebido do provider:', data);
      const qrString = typeof data === 'string' ? data : data?.qr;
      if (!qrString) {
        console.error('❌ QR inválido recebido:', data);
        return;
      }

      const url = await QRCode.toDataURL(qrString);

// evita rebroadcast se o QR não mudou
if (ultimoQrRef.value === url) {
  console.log('ℹ️ QR idêntico ao anterior — não reenviando.');
  return;
}

ultimoQrRef.value = url;                     // atualiza o cache
io.emit('qrCode', { qr: url });              // envia aos frontends conectados
console.log('✅ DataURL do QR gerado e distribuído (len:', url.length, ')');

    } catch (err) {
      console.error('❌ Erro ao processar QR:', err?.message);
    }
  };

  socketProvider.__qrHandler = handler;
  socketProvider.on('qrCode', handler);
};
