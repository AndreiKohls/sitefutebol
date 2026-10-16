const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', 'futebol.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS times (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT    NOT NULL,
    cidade    TEXT,
    estadio   TEXT,
    fundacao  INTEGER
  );

  CREATE TABLE IF NOT EXISTS jogadores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT    NOT NULL,
    posicao       TEXT    NOT NULL,
    numero        INTEGER NOT NULL,
    idade         INTEGER,
    nacionalidade TEXT,
    time_id       INTEGER NOT NULL,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE
  );
`);

const totalTimes = db.prepare('SELECT COUNT(*) AS total FROM times').get().total;

if (totalTimes === 0) {
  const inserirTime = db.prepare(
    'INSERT INTO times (nome, cidade, estadio, fundacao) VALUES (?, ?, ?, ?)'
  );
  const inserirJogador = db.prepare(
    `INSERT INTO jogadores (nome, posicao, numero, idade, nacionalidade, time_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const t1 = inserirTime.run('Grêmio', 'Porto Alegre', 'Arena do Grêmio', 1903).lastInsertRowid;
  const t2 = inserirTime.run('Palmeiras', 'São Paulo', 'Allianz Parque', 1914).lastInsertRowid;

  inserirJogador.run('Carlos Miguel', 'Goleiro', 1, 26, 'Brasil', t1);
  inserirJogador.run('Villasanti', 'Volante', 5, 27, 'Paraguai', t1);
  inserirJogador.run('Cristaldo', 'Atacante', 9, 28, 'Argentina', t1);
  inserirJogador.run('Weverton', 'Goleiro', 1, 36, 'Brasil', t2);
  inserirJogador.run('Raphael Veiga', 'Meia', 23, 29, 'Brasil', t2);

  console.log('🌱 Banco populado com dados de exemplo.');
}

module.exports = db;
