const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const times = db.prepare(`
    SELECT t.id, t.nome, t.cidade, t.estadio, t.fundacao,
           COUNT(j.id) AS total_jogadores
    FROM times t
    LEFT JOIN jogadores j ON j.time_id = t.id
    GROUP BY t.id
    ORDER BY t.nome
  `).all();

  res.json(times);
});

router.get('/:id', (req, res) => {
  const time = db.prepare('SELECT * FROM times WHERE id = ?').get(req.params.id);

  if (!time) {
    return res.status(404).json({ erro: 'Time não encontrado' });
  }

  const jogadores = db
    .prepare('SELECT * FROM jogadores WHERE time_id = ? ORDER BY numero')
    .all(req.params.id);

  res.json({ ...time, jogadores });
});

router.post('/', (req, res) => {
  const { nome, cidade, estadio, fundacao } = req.body;

  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ erro: 'O campo "nome" é obrigatório' });
  }

  const info = db
    .prepare('INSERT INTO times (nome, cidade, estadio, fundacao) VALUES (?, ?, ?, ?)')
    .run(
      String(nome).trim(),
      cidade ? String(cidade).trim() : null,
      estadio ? String(estadio).trim() : null,
      fundacao ? Number(fundacao) : null
    );

  const criado = db.prepare('SELECT * FROM times WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(criado);
});

router.put('/:id', (req, res) => {
  const existe = db.prepare('SELECT id FROM times WHERE id = ?').get(req.params.id);

  if (!existe) {
    return res.status(404).json({ erro: 'Time não encontrado' });
  }

  const { nome, cidade, estadio, fundacao } = req.body;

  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ erro: 'O campo "nome" é obrigatório' });
  }

  db.prepare(
    'UPDATE times SET nome = ?, cidade = ?, estadio = ?, fundacao = ? WHERE id = ?'
  ).run(
    String(nome).trim(),
    cidade ? String(cidade).trim() : null,
    estadio ? String(estadio).trim() : null,
    fundacao ? Number(fundacao) : null,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM times WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM times WHERE id = ?').run(req.params.id);

  if (info.changes === 0) {
    return res.status(404).json({ erro: 'Time não encontrado' });
  }

  res.status(204).send();
});

module.exports = router;
