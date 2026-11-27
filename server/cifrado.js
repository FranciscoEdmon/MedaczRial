const { createCipheriv, createDecipheriv, randomBytes } = require('node:crypto');
const clave = Buffer.from(process.env.MEDACZ_CLAVE_BASE64 || '', 'base64');
if (clave.length !== 32) throw new Error('La clave de cifrado debe tener 32 bytes');
const prefijo = 'medacz:v1:';

function encriptar(texto) {
  const iv = randomBytes(12);
  const cifrador = createCipheriv('aes-256-gcm', clave, iv);
  const datos = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  return prefijo + Buffer.concat([iv, cifrador.getAuthTag(), datos]).toString('base64');
}

function desencriptar(valor) {
  // Las cuentas anteriores contienen texto sin cifrar.
  if (!valor.startsWith(prefijo)) return valor;
  const bloque = Buffer.from(valor.slice(prefijo.length), 'base64');
  if (bloque.length < 28) throw new Error('Campo cifrado incompleto');
  const lector = createDecipheriv('aes-256-gcm', clave, bloque.subarray(0, 12));
  lector.setAuthTag(bloque.subarray(12, 28));
  return Buffer.concat([lector.update(bloque.subarray(28)), lector.final()]).toString('utf8');
}

module.exports = { encriptar, desencriptar };
