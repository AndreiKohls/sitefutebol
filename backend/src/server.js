const express = require('express');
const cors = require('cors');

const timesRoutes = require('./routes/times.routes');
const jogadoresRoutes = require('./routes/jogadores.routes');

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API Sistema de Times de Futebol está no ar ⚽' });
});

app.use('/times', timesRoutes);
app.use('/jogadores', jogadoresRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`);
});
