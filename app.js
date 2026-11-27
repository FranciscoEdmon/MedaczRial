requie('express');
const http = require('node:http');
const { crearApp } = require('./server/api');
const { crearPool } = require('./server/db');
const { conectarNotificaciones } = require('./server/notificaciones');

const pool = crearPool();
const servidor = http.createServer(crearApp(pool));
conectarNotificaciones(servidor, pool);
module.exports = servidor;

if (require.main === module) {
  servidor.listen(process.env.PORT || 3000);
}