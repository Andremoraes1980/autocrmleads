// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Habilita CORS apenas para seus domínios de produção
app.use(cors({
  origin: ["https://autocrmleads.vercel.app", "https://www.autocrmleads.com.br"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
console.log("✅ CORS configurado para Vercel e domínio personalizado");

app.use(express.json());

// Rota de teste
app.get('/ping', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
console.log("🔎 Rota GET /ping pronta para teste externo");

// Rota de autenticação com Mercado Livre
app.post('/api/ml-auth', async (req, res) => {
  const { code } = req.body;

  console.log("🔑 Recebido code do Mercado Livre:", code);

  try {
    const result = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.ML_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log("✅ Token recebido:", result.data);
    res.json(result.data);
  } catch (err) {
    console.error("❌ Erro ao trocar code por token:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
