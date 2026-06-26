require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  // Supprimer ancien admin s'il existe
  await conn.query('DELETE FROM admins WHERE username = ?', ['admin']);

  // Insérer le nouveau avec le VRAI hash
  await conn.query(
    'INSERT INTO admins (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
    ['admin', hash, 'admin@md38.com', 'MD38 Admin', 'super']
  );

  console.log('✅ Admin créé avec succès !');
  console.log('👤 Username: admin');
  console.log('🔑 Password: admin123');
  console.log('🔐 Hash:', hash);

  await conn.end();
})();