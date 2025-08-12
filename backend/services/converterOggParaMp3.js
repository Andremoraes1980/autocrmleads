// backend/services/converterOggParaMp3.js
const fs = require('fs');
const ffmpegPathPkg = require('ffmpeg-static');
const { spawn } = require('child_process');

function resolveFfmpegPath() {
  const candidates = [
    ffmpegPathPkg,
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
 * Converte Buffer OGG/Opus → MP3 (libmp3lame)
 * @param {Buffer} oggBuffer
 * @returns {Promise<Buffer>} mp3Buffer
 */
function converterOggParaMp3(oggBuffer) {
  return new Promise((resolve, reject) => {
    const ffmpegPath = resolveFfmpegPath();
    if (!ffmpegPath) return reject(new Error('ffmpeg não encontrado no ambiente.'));

    console.log('🎯 [FFMPEG] usando binário em:', ffmpegPath);

    const ff = spawn(ffmpegPath, [
      '-y',
      '-i', 'pipe:0',
      '-vn',
      '-acodec', 'libmp3lame',
      '-b:a', '128k',
      '-f', 'mp3',
      'pipe:1',
    ]);

    const chunks = [];
    let stderr = '';

    ff.stdout.on('data', d => chunks.push(d));
    ff.stderr.on('data', d => { stderr += d.toString(); });
    ff.on('error', err => reject(new Error(`Erro ao iniciar ffmpeg: ${err.message}`)));
    ff.on('close', code => {
      if (code === 0) return resolve(Buffer.concat(chunks));
      reject(new Error(`ffmpeg saiu com código ${code}: ${stderr}`));
    });

    ff.stdin.write(oggBuffer);
    ff.stdin.end();
  });
}

module.exports = { converterOggParaMp3 };
