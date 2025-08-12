// backend/services/converterWebmParaOgg.js
const fs = require('fs');
const ffmpegPathPkg = require('ffmpeg-static');
const { spawn } = require('child_process');

/**
 * Resolve um caminho executável de ffmpeg:
 * - Tenta o ffmpeg-static
 * - Faz chmod +x se precisar
 * - Fallback para /usr/bin/ffmpeg ou /usr/local/bin/ffmpeg se existir
 */
function resolveFfmpegPath() {
  const candidates = [
    ffmpegPathPkg,                    // p.ex. /opt/render/project/src/node_modules/ffmpeg-static/ffmpeg
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        try { fs.chmodSync(p, 0o755); } catch (_) {}
        return p;
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Converte Buffer WEBM (MediaRecorder) → OGG/Opus.
 * @param {Buffer} webmBuffer
 * @returns {Promise<Buffer>} oggBuffer
 */
function converterWebmParaOgg(webmBuffer) {
  return new Promise((resolve, reject) => {
    const ffmpegPath = resolveFfmpegPath();
    if (!ffmpegPath) {
      return reject(new Error('ffmpeg não encontrado (ffmpeg-static ausente e /usr/bin/ffmpeg indisponível).'));
    }

    // Log útil para diagnosticar ambiente (apaga depois se quiser)
    console.log('🎯 [FFMPEG] usando binário em:', ffmpegPath);

    const ff = spawn(ffmpegPath, [
      '-y',
      '-i', 'pipe:0',
      '-vn',
      '-acodec', 'libopus',
      '-b:a', '64k',
      '-f', 'ogg',
      'pipe:1'
    ]);

    const chunks = [];
    let stderr = '';

    ff.stdout.on('data', (d) => chunks.push(d));
    ff.stderr.on('data', (d) => { stderr += d.toString(); });
    ff.on('error', (err) => reject(new Error(`Erro ao iniciar ffmpeg: ${err.message}`)));
    ff.on('close', (code) => {
      if (code === 0) return resolve(Buffer.concat(chunks));
      reject(new Error(`ffmpeg saiu com código ${code}: ${stderr}`));
    });

    ff.stdin.write(webmBuffer);
    ff.stdin.end();
  });
}

module.exports = { converterWebmParaOgg };
