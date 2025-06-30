import React, { useState, useRef } from "react";

const TEMPO_MAXIMO = 120; // segundos de gravação permitidos

export default function AudioRecorder({ onAudioReady }) {
  const [gravando, setGravando] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null); // ← blob local
  const [tempo, setTempo] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Botão X — descarta áudio
  const handleRemoverAudio = () => {
    setAudioBlob(null);
    if (onAudioReady) onAudioReady(null);
  };

  // Gravação de áudio
  const handleGravarAudio = async () => {
    if (gravando) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setGravando(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob); // ← preview local
        if (onAudioReady) onAudioReady(blob); // ← manda para o pai
        stream.getTracks().forEach(track => track.stop());
        chunksRef.current = [];
      };

      mediaRecorderRef.current = recorder;

      // Timer para limitar a gravação
      setTempo(0);
      timerRef.current = setInterval(() => {
        setTempo(prev => {
          if (prev + 1 >= TEMPO_MAXIMO) {
            if (mediaRecorderRef.current && gravando) {
              mediaRecorderRef.current.stop();
              setGravando(false);
            }
            clearInterval(timerRef.current);
            return TEMPO_MAXIMO;
          }
          return prev + 1;
        });
      }, 1000);

      recorder.start();
      setGravando(true);
    } catch (err) {
      alert("Permissão de microfone negada ou erro: " + err.message);
    }
  };

  return (
    <div style={{ display: "inline-block", margin: "0 7px" }}>
      <button
        type="button"
        onClick={handleGravarAudio}
        style={{
          background: gravando ? "#f8d7da" : "#fff",
          border: "1px solid #ddd",
          borderRadius: 5,
          padding: "4px 8px",
          fontSize: 20,
          cursor: "pointer"
        }}
        title={gravando ? "Parar gravação" : "Gravar áudio"}
      >
        {gravando ? "⏹️" : "🎤"}
      </button>

      {gravando && (
        <span style={{ marginLeft: 8, fontSize: 15, color: "#333" }}>
          ⏱️ {String(tempo).padStart(2, "0")}/{TEMPO_MAXIMO}s
        </span>
      )}

      {audioBlob && (
        <span style={{ marginLeft: 6 }}>
          <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: 130, verticalAlign: "middle" }} />
          <button onClick={handleRemoverAudio} style={{
            color: "#b22", background: "none", border: "none", marginLeft: 3, fontSize: 16, cursor: "pointer"
          }}
            title="Descartar áudio">✖️</button>
        </span>
      )}
    </div>
  );
}
