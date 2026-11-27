const { WebSocket, WebSocketServer } = require('ws');
const { resumen } = require('./seguridad');

const notas = {
  nuevaAsignada: 'Solicitud registrada y asignada automáticamente al ingeniero.',
  nuevaPendiente: 'Solicitud registrada. No hay ingenieros activos disponibles; queda pendiente de asignación.',
  asignacion: 'Ingeniero asignado.',
  estado: 'Estado actualizado.',
};

const tipos = new Map([
  [notas.nuevaAsignada, 'solicitud:nueva'],
  [notas.nuevaPendiente, 'solicitud:nueva'],
  [notas.asignacion, 'solicitud:asignada'],
  [notas.estado, 'solicitud:estado'],
]);

const sesion = `FROM medacz.sesion s JOIN medacz.usuario u ON u.identificador = s.usuario`;
const vigente = 's.resumen = ? AND s.caducidad > ? AND u.activo = 1';
const consulta = `SELECT aviso.* ${sesion}
  LEFT JOIN LATERAL (
    SELECT e.identificador, e.solicitud, e.estado, e.nota, sol.ingeniero, sol.hospital
    FROM medacz.evento_solicitud e JOIN medacz.solicitud sol ON sol.identificador = e.solicitud
    WHERE e.identificador > ? AND e.nota IN (?, ?, ?, ?)
      AND (u.rol = 'administrador' OR (u.rol = 'hospital' AND sol.hospital = u.hospital)
        OR (u.rol = 'ingeniero' AND sol.ingeniero = u.identificador))
    ORDER BY e.identificador LIMIT 50
  ) aviso ON true WHERE ${vigente} ORDER BY aviso.identificador`;

function rechazar(socket, estado) {
  socket.end(`HTTP/1.1 ${estado}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

function conectarNotificaciones(servidor, pool) {
  const ws = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  servidor.on('upgrade', async (req, socket, head) => {
    socket.on('error', () => socket.destroy());
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname !== '/api/notificaciones') return rechazar(socket, '404 Not Found');
      const host = req.headers.host;
      if (!host || ![`https://${host}`, `http://${host}`].includes(req.headers.origin)) {
        return rechazar(socket, '403 Forbidden');
      }
      const cookie = /(?:^|;\s*)medacz_sesion=([a-f\d]{64})(?:;|$)/i.exec(req.headers.cookie || '');
      if (!cookie) return rechazar(socket, '401 Unauthorized');
      const claveSesion = resumen(cookie[1]);
      const desde = url.searchParams.get('desde');
      if (desde !== null && !/^\d{1,10}$/.test(desde)) return rechazar(socket, '400 Bad Request');
      const [filas] = await pool.execute(`SELECT COALESCE(MAX(identificador), 0) AS ultimo
        FROM medacz.evento_solicitud
        HAVING EXISTS (SELECT 1 ${sesion} WHERE ${vigente})`, [claveSesion, Date.now()]);
      if (!filas.length) return rechazar(socket, '401 Unauthorized');
      const inicio = desde === null ? filas[0].ultimo : Math.min(Number(desde), filas[0].ultimo);
      if (!socket.destroyed) ws.handleUpgrade(req, socket, head, cliente => {
        seguir(cliente, pool, claveSesion, inicio);
      });
    } catch {
      if (!socket.destroyed) rechazar(socket, '503 Service Unavailable');
    }
  });
}

function seguir(cliente, pool, claveSesion, cursor) {
  let temporizador;
  cliente.on('close', () => clearTimeout(temporizador));
  cliente.on('error', () => cliente.terminate());
  cliente.on('message', () => cliente.close(1008));
  cliente.send(JSON.stringify({ tipo: 'inicio', cursor }));

  async function leer() {
    try {
      const [filas] = await pool.execute(consulta, [cursor, ...tipos.keys(), claveSesion, Date.now()]);
      if (cliente.readyState !== WebSocket.OPEN) return;
      if (!filas.length) return cliente.close(1008, 'Sesión cerrada');
      for (const fila of filas) {
        if (fila.identificador === null) break;
        cursor = fila.identificador;
        cliente.send(JSON.stringify({
          tipo: tipos.get(fila.nota), cursor, solicitudId: fila.solicitud, estado: fila.estado,
          ingenieroId: fila.ingeniero, hospitalId: fila.hospital,
        }));
      }
      temporizador = setTimeout(leer, filas.length === 50 ? 0 : 5000);
    } catch {
      cliente.close(1011, 'Error al consultar los avisos');
    }
  }
  leer();
}

module.exports = { conectarNotificaciones, notas };
