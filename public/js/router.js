import { estado, panel, aviso } from './estado.js';
import { mensaje } from './utils/mensajes.js';
import { menus, opcionesMenu } from './menus.js';
import { usuarios } from './vistas/usuarios.js';
import { hospitales } from './vistas/hospitales.js';
import { equipos } from './vistas/equipos.js';
import { solicitudes } from './vistas/solicitudes.js';
import { miCuenta } from './vistas/cuenta.js';

export async function navegar() {
  aviso.hidden = true;
  const view = location.hash.slice(1) || menus[estado.cuenta.rol][0][0];
  const opciones = opcionesMenu(estado.cuenta.rol);

  if (!opciones.some((x) => x[0] === view)) {
    location.hash = opciones[0][0];
    return;
  }

  document.getElementById('titulo').textContent = opciones.find((x) => x[0] === view)[1];
  document.querySelectorAll('#menu a').forEach((a) => {
    a.classList.toggle('active', a.hash === '#' + view);
  });

  panel.innerHTML = '<p role="status">Cargando…</p>';

  try {
    await {
      usuarios,
      hospitales,
      equipos,
      solicitudes,
      historial: () => solicitudes(true),
      cuenta: miCuenta,
    }[view]();
  } catch (e) {
    panel.innerHTML = '';
    mensaje(e.message, true);
  }
}
