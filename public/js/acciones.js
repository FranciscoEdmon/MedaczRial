import { estado, panel } from './estado.js';
import { api } from './utils/api.js';
import { mensaje } from './utils/mensajes.js';
import { usuarios } from './vistas/usuarios.js';
import { hospitales } from './vistas/hospitales.js';
import { equipos } from './vistas/equipos.js';
import { solicitudes } from './vistas/solicitudes.js';
import { detalle } from './vistas/detalle/index.js';

export function instalarAcciones() {
  panel.onclick = async (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const id = Number(b.dataset.id);

    try {
      switch (b.dataset.action) {
        case 'editar-usuario':
          await usuarios(id);
          break;
        case 'editar-equipo':
          await equipos(id);
          break;
        case 'borrar-usuario':
          if (confirm('¿Eliminar esta cuenta? Esta acción no se puede deshacer.')) {
            await api('/usuarios/' + id, 'DELETE');
            await usuarios();
            mensaje('Cuenta eliminada.');
          }
          break;
        case 'borrar-hospital':
          if (
            confirm(
              '¿Eliminar este hospital? Solo se puede eliminar si no tiene usuarios, equipos ni solicitudes asociados.'
            )
          ) {
            await api('/hospitales/' + id, 'DELETE');
            await hospitales();
            mensaje('Hospital eliminado.');
          }
          break;
        case 'borrar-equipo':
          if (confirm('¿Eliminar el equipo del inventario? Se conservará su historial.')) {
            await api('/equipos/' + id, 'DELETE');
            await equipos();
          }
          break;
        case 'detalle':
          await detalle(id);
          break;
        case 'volver-solicitudes':
          await solicitudes(location.hash === '#historial');
          break;
        case 'anterior':
          estado.pagina = Math.max(1, estado.pagina - 1);
          await solicitudes(location.hash === '#historial');
          break;
        case 'siguiente':
          estado.pagina++;
          await solicitudes(location.hash === '#historial');
          break;
      }
    } catch (err) {
      mensaje(err.message, true);
    }
  };
}
