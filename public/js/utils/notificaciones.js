import { estado } from '../estado.js';
import { mensaje } from './mensajes.js';
import { navegar } from '../router.js';

export function conectarNotificaciones() {
  let espera = 1000;
  let cursor = null;

  function conectar() {
    const protocolo = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = new URL(`${protocolo}//${location.host}/api/notificaciones`);
    if (cursor !== null) url.searchParams.set('desde', cursor);
    const socket = new WebSocket(url);
    let abierto = false;

    socket.onopen = () => {
      abierto = true;
      espera = 1000;
    };

    socket.onmessage = event => {
      let notificacion;
      try {
        notificacion = JSON.parse(event.data);
      } catch (error) {
        console.error('Notificación WebSocket inválida:', error);
        return;
      }

      cursor = notificacion.cursor;
      if (notificacion.tipo === 'inicio') return;
      
      const numero = `OS-${String(notificacion.solicitudId).padStart(8, '0')}`;
      let texto;
      if (notificacion.tipo === 'solicitud:nueva') {
        texto =
          String(estado.cuenta.identificador) === String(notificacion.ingenieroId)
            ? `Nueva solicitud ${numero} asignada a ti.`
            : `Se registró la solicitud ${numero}.`;
      } else if (notificacion.tipo === 'solicitud:asignada') {
        texto =
          String(estado.cuenta.identificador) === String(notificacion.ingenieroId)
            ? `Te asignaron la solicitud ${numero}.`
            : `Se asignó un ingeniero a la solicitud ${numero}.`;
      } else if (notificacion.tipo === 'solicitud:estado') {
        texto = `La solicitud ${numero} cambió a "${notificacion.estado}".`;
      } else {
        return;
      }

      const vista = (location.hash || document.querySelector('#menu a.active')?.hash || '').slice(1);
      const actualizar = ['solicitudes', 'historial'].includes(vista) &&
        !document.querySelector('dialog[open]');
      if (actualizar) {
        navegar().then(() => mensaje(texto)).catch(error => {
          console.error('No se pudo actualizar la lista de solicitudes:', error);
          mensaje(texto);
        });
      } else {
        mensaje(texto);
      }
    };

    socket.onclose = async event => {
      if (event.code === 1008) return location.replace('/login.html');
      if (!abierto) {
        try {
          const respuesta = await fetch('/api/cuenta');
          if (respuesta.status === 401) return location.replace('/login.html');
        } catch {
          // Reintentar al recuperar la conexión.
        }
      }
      setTimeout(conectar, espera);
      espera = Math.min(espera * 2, 30000);
    };
  }

  conectar();
}
