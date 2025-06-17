// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Habilita CORS apenas para seus domínios de produção
app.use(cors({
  origin: [
    "https://autocrmleads.vercel.app",
    "https://autocrmleads.com.br",
    "https://www.autocrmleads.com.br",
    "http://localhost:5173" // remove depois se não for usar local
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
console.log("✅ CORS configurado para Vercel, domínio com e sem www e local dev");

app.use((req, res, next) => {
  console.log("🌎 Origem da requisição:", req.headers.origin);
  next();
});

// server.js (ou arquivo de rotas)
app.post('/api/ml-webhook', (req, res) => {
  console.log("🔔 Webhook recebido do Mercado Livre:", req.body);
  res.sendStatus(200);
});



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
        code,
        redirect_uri: process.env.ML_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    console.log("✅ Token recebido do ML:", result.data);
return res.json(result.data);

  } catch (err) {
    console.error("❌ Erro ao trocar code por token:", err?.response?.data || err.message);
    return res.status(500).json({ message: "Erro ao autenticar com Mercado Livre." });
  }
  
});

// Inicializa servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
