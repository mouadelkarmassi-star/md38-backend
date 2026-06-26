require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const ADMIN1 = {
  username: 'MD38-supperadmin',
  password: 'Rechauffement9@',
  email: 'Mouad@md38.com',
  name: 'Owner Principal'
};

const ADMIN2 = {
  username: 'MD38-miniadmin',
  password: 'Chaffak382007',
  email: 'Abderrazak@md38.com',
  name: 'Co Manager'
};

console.log('');
console.log('========================================');
console.log('   MD38 - CREATION DES 2 ADMINS');
console.log('========================================');
console.log('');

mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'md38'
})
.then(function(conn) {
  console.log('[1/5] Connecte a la base de donnees');
  console.log('[2/5] Suppression des anciens admins...');
  return conn.query('DELETE FROM admins').then(function() { return conn; });
})
.then(function(conn) {
  console.log('[3/5] Hash des mots de passe...');
  return Promise.all([
    bcrypt.hash(ADMIN1.password, 10),
    bcrypt.hash(ADMIN2.password, 10)
  ]).then(function(hashes) {
    return { conn: conn, h1: hashes[0], h2: hashes[1] };
  });
})
.then(function(data) {
  console.log('[4/5] Creation Admin 1 (Owner)...');
  return data.conn.query(
    'INSERT INTO admins (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
    [ADMIN1.username, data.h1, ADMIN1.email, ADMIN1.name, 'super']
  ).then(function() {
    console.log('[5/5] Creation Admin 2 (Manager)...');
    return data.conn.query(
      'INSERT INTO admins (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [ADMIN2.username, data.h2, ADMIN2.email, ADMIN2.name, 'admin']
    ).then(function() { return data.conn; });
  });
})
.then(function(conn) {
  console.log('');
  console.log('========================================');
  console.log('   SUCCES! 2 ADMINS CREEES!');
  console.log('========================================');
  console.log('');
  console.log('ADMIN 1 - OWNER PRINCIPAL:');
  console.log('  Username : ' + ADMIN1.username);
  console.log('  Password : ' + ADMIN1.password);
  console.log('  Email    : ' + ADMIN1.email);
  console.log('  Role     : super (acces total)');
  console.log('----------------------------------------');
  console.log('ADMIN 2 - CO MANAGER:');
  console.log('  Username : ' + ADMIN2.username);
  console.log('  Password : ' + ADMIN2.password);
  console.log('  Email    : ' + ADMIN2.email);
  console.log('  Role     : admin (acces standard)');
  console.log('========================================');
  console.log('');
  console.log('Login : http://localhost:5000/admin/login.html');
  console.log('');
  console.log('NOTE: Ces admins sont permanents dans la base.');
  console.log('');
  return conn.end();
})
.then(function() {
  process.exit(0);
})
.catch(function(e) {
  console.error('');
  console.error('ERREUR: ' + e.message);
  console.error('');
  process.exit(1);
});