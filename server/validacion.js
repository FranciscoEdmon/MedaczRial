const actividades = ['Inspección visual', 'Revisión de conexiones', 'Limpieza exterior', 'Verificación de accesorios', 'Prueba de funcionamiento'];
const regexControl = /[\u0000-\u001F\u007F]/;
const regexClave = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;
const regexUsuario = /^[a-z0-9._-]{3,40}$/;
const reglas = require('../public/js/reglas');

function fallo(status, message) { return Object.assign(new Error(message), { status }); }
function normalizarTexto(value) {
  if (typeof value !== 'string') return null;
  const texto = value.trim();
  if (!texto || regexControl.test(texto)) return null;
  return texto;
}
function texto(value, campo, max = 150) {
  const textoNormalizado = normalizarTexto(value);
  if (!textoNormalizado || textoNormalizado.length > max) throw fallo(400, `${campo}: texto requerido, máximo ${max} caracteres`);
  return textoNormalizado;
}
function nombre(value, campo = 'nombre') {
  const textoNormalizado = normalizarTexto(value);
  if (!textoNormalizado) throw fallo(400, `${campo}: este campo es obligatorio.`);
  if (textoNormalizado.length < 2 || textoNormalizado.length > 120) throw fallo(400, `${campo}: escribe entre 2 y 120 caracteres.`);
  const error = reglas.error('usuario', 'nombre', textoNormalizado);
  if (error) throw fallo(400, campo + ': ' + error);
  return textoNormalizado;
}
function usuario(value, campo = 'usuario') {
  const textoNormalizado = normalizarTexto(value);
  if (!textoNormalizado) throw fallo(400, `${campo}: este campo es obligatorio.`);
  if (!regexUsuario.test(textoNormalizado)) throw fallo(400, `${campo}: usa entre 3 y 40 caracteres; se permiten letras, números, punto, guion y guion bajo.`);
  return textoNormalizado.toLowerCase();
}
function id(value, campo = 'identificador') {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 4294967295) throw fallo(400, `${campo} inválido`);
  return Number(value);
}
function opcion(value, opciones, campo) {
  if (!opciones.includes(value)) throw fallo(400, `${campo} inválido`);
  return value;
}
function clave(value) {
  if (typeof value !== 'string' || !regexClave.test(value)) throw fallo(400, 'Contraseña inicial: usa entre 12 y 128 caracteres e incluye una mayúscula, una minúscula, un número y un símbolo.');
  return value;
}
function checklist(value) {
  if (!Array.isArray(value) || value.length !== actividades.length) throw fallo(400, 'Completa las cinco actividades del checklist');
  const resultado = actividades.map(actividad => {
    const matches = value.filter(item => item && item.actividad === actividad);
    if (matches.length !== 1) throw fallo(400, 'Cada actividad debe aparecer exactamente una vez');
    const item = matches[0];
    const resultado = opcion(item.resultado, ['Cumple', 'No cumple', 'No aplica'], 'resultado');
    const anomalia = item.anomalia == null ? '' : textoOpcional(item.anomalia, 'anomalía');
    if (resultado === 'No cumple' && !anomalia) throw fallo(400, 'Describe la anomalía de cada actividad que no cumple');
    return { actividad, resultado, anomalia };
  });
  return resultado;
}
function textoOpcional(value, campo) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw fallo(400, `${campo}: máximo 3000 caracteres`);
  const textoNormalizado = value.trim();
  if (!textoNormalizado) return '';
  if (regexControl.test(textoNormalizado) || textoNormalizado.length > 3000) throw fallo(400, `${campo}: máximo 3000 caracteres`);
  return textoNormalizado;
}
module.exports = { actividades, fallo, texto, nombre, usuario, id, opcion, clave, checklist, textoOpcional };
