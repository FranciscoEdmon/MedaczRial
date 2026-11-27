const crypto = require('node:crypto'); 
const { promisify } = require('node:util'); //callbacks
const scrypt = promisify(crypto.scrypt);

const resumen = value => crypto.createHash('sha256').update(value).digest('hex');
async function derivar(clave) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${(await scrypt(clave, salt, 64)).toString('hex')}`;
}
async function verificar(clave, encoded) {
  const [type, salt, hash] = String(encoded).split('$');
  if (type !== 'scrypt' || !/^[a-f\d]{32}$/.test(salt) || !/^[a-f\d]{128}$/.test(hash)) return false;
  const derived = await scrypt(clave, salt, 64);
  return crypto.timingSafeEqual(derived, Buffer.from(hash, 'hex'));
}
module.exports = { derivar, verificar, resumen };
