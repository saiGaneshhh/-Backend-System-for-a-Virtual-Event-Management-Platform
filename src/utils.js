const crypto = require('node:crypto');
function id() { return crypto.randomUUID(); }
function safeUser(user) { const { passwordHash, ...publicUser } = user; return publicUser; }
module.exports = { id, safeUser };
