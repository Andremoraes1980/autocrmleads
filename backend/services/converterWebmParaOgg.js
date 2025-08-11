// backend/services/converterWebmParaOgg.js
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');

/**
 * Converte Buffer WEBM (MediaRecorder) → OGG/Opus.
 * @param {Buffer} webmBuffer
 * @returns {Promise<Buffer>} oggBuffer
 */
function converterWebmParaOgg(webmBuffer) {
  return new Promise((resolve, reject) => {
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
    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code === 0) return resolve(Buffer.concat(chunks));
      reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
    });

    ff.stdin.write(webmBuffer);
    ff.stdin.end();
  });
}

module.exports = { converterWebmParaOgg };
