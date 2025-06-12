// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

// Troca code por access_token
app.post('/api/ml-auth', async (req, res) => {
  const { code } = req.body;

  // LOG: code recebido
  console.log("🔑 Recebido code do Mercado Livre:", code);

  try {
    const result = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      new URLSearchParams({
        grant_type:    'authorization_code',
client_id:     process.env.ML_CLIENT_ID,
client_secret: process.env.ML_CLIENT_SECRET,
code:          code,
redirect_uri:  process.env.ML_REDIRECT_URI,

      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // LOG: token recebido
    console.log("✅ Token recebido:", result.data);

    res.json(result.data);
  } catch (err) {
    console.error("❌ Erro ao trocar code por token:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Inicia servidor backend na porta 5000
// Usa PORT de variáveis de ambiente ou 5000 como padrão
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});

