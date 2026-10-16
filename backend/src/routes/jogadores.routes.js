const express = require('express');
const db = require('../database');

const router = express.Router();

const POSICOES_VALIDAS = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'];

function validar({ nome, posicao, numero, time_id }) {
  if (!nome || !String(nome).trim()) return 'O campo "nome" é obrigatório';
  if (!posicao || !POSICOES_VALIDAS.includes(posicao)) return 'Posição inválida';
  if (numero === undefined || numero === null || Number.isNaN(Number(numero)))
    return 'O campo "numero" é obrigatório e deve ser numérico';
  if (!time_id) return 'O campo "time_id" é obrigatório';
  return null;
}

router.get('/', (req, res) => {
  const { time_id, posicao, busca } = req.query;

  let sql = `
    SELECT j.*, t.nome AS time_nome
    FROM jogadores j
    INNER JOIN times t ON t.id = j.time_id
    WHERE 1 = 1
  `;
  const params = [];

  if (time_id) {
    sql += ' AND j.time_id = ?';
    params.push(time_id);
  }
  if (posicao) {
    sql += ' AND j.posicao = ?';
    params.push(posicao);
  }
  if (busca) {
    sql += ' AND j.nome LIKE ?';
    params.push(`%${busca}%`);
  }

  sql += ' ORDER BY t.nome, j.numero';

  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const jogador = db
    .prepare(`
      SELECT j.*, t.nome AS time_nome
      FROM jogadores j
      INNER JOIN times t ON t.id = j.time_id
      WHERE j.id = ?
    `)
    .get(req.params.id);

  if (!jogador) return res.status(404).json({ erro: 'Jogador não encontrado' });

  res.json(jogador);
});

router.post('/', (req, res) => {
  const { nome, posicao, numero, idade, nacionalidade, time_id } = req.body;

  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  const timeExiste = db.prepare('SELECT id FROM times WHERE id = ?').get(time_id);
  if (!timeExiste) return res.status(400).json({ erro: 'Time informado não existe' });

  const numeroEmUso = db
    .prepare('SELECT id FROM jogadores WHERE time_id = ? AND numero = ?')
    .get(time_id, Number(numero));

  if (numeroEmUso) {
    return res.status(409).json({ erro: `A camisa ${numero} já está em uso neste time` });
  }

  const info = db
    .prepare(`
      INSERT INTO jogadores (nome, posicao, numero, idade, nacionalidade, time_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      String(nome).trim(),
      posicao,
      Number(numero),
      idade ? Number(idade) : null,
      nacionalidade ? String(nacionalidade).trim() : null,
      Number(time_id)
    );

  const criado = db
    .prepare(`
      SELECT j.*, t.nome AS time_nome
      FROM jogadores j INNER JOIN times t ON t.id = j.time_id
      WHERE j.id = ?
    `)
    .get(info.lastInsertRowid);

  res.status(201).json(criado);
});

router.put('/:id', (req, res) => {
  const existe = db.prepare('SELECT id FROM jogadores WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ erro: 'Jogador não encontrado' });

  const { nome, posicao, numero, idade, nacionalidade, time_id } = req.body;

  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  const timeExiste = db.prepare('SELECT id FROM times WHERE id = ?').get(time_id);
  if (!timeExiste) return res.status(400).json({ erro: 'Time informado não existe' });

  const numeroEmUso = db
    .prepare('SELECT id FROM jogadores WHERE time_id = ? AND numero = ? AND id <> ?')
    .get(time_id, Number(numero), req.params.id);

  if (numeroEmUso) {
    return res.status(409).json({ erro: `A camisa ${numero} já está em uso neste time` });
  }

  db.prepare(`
    UPDATE jogadores
    SET nome = ?, posicao = ?, numero = ?, idade = ?, nacionalidade = ?, time_id = ?
    WHERE id = ?
  `).run(
    String(nome).trim(),
    posicao,
    Number(numero),
    idade ? Number(idade) : null,
    nacionalidade ? String(nacionalidade).trim() : null,
    Number(time_id),
    req.params.id
  );

  const atualizado = db
    .prepare(`
      SELECT j.*, t.nome AS time_nome
      FROM jogadores j INNER JOIN times t ON t.id = j.time_id
      WHERE j.id = ?
    `)
    .get(req.params.id);

  res.json(atualizado);
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM jogadores WHERE id = ?').run(req.params.id);

  if (info.changes === 0) return res.status(404).json({ erro: 'Jogador não encontrado' });

  res.status(204).send();
});

module.exports = router;
