import { estado, roles } from './estado.js';
import { api } from './utils/api.js';
import { esc } from './utils/esc.js';
import { mensaje } from './utils/mensajes.js';
import { opcionesMenu } from './menus.js';
import { instalarDialogos } from './ui/dialogos.js';
import { instalarValidacionCampos } from './ui/campos.js';
import { instalarAcciones } from './acciones.js';
import { navegar } from './router.js';
import { conectarNotificaciones } from './utils/notificaciones.js';

instalarDialogos();
instalarValidacionCampos();
instalarAcciones();

document.getElementById('cerrar-sesion').onclick = async () => {
  if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) return;
  try {
    await api('/sesiones/actual', 'DELETE');
    location.replace('/login.html');
  } catch (error) {
    mensaje(error.message, true);
  }
};

async function iniciar() {
  estado.cuenta = await api('/cuenta');
  document.getElementById('nombre').textContent = estado.cuenta.nombre_completo || estado.cuenta.nombre;
  document.getElementById('perfil').textContent = roles[estado.cuenta.rol];
  document.getElementById('menu').innerHTML = opcionesMenu(estado.cuenta.rol)
    .map(([id, label]) => `<a class="nav-link text-white" href="#${id}">${esc(label)}</a>`)
    .join('');
  conectarNotificaciones();

  window.onhashchange = () => {
    estado.pagina = 1;
    estado.filtrosSolicitud = {};
    navegar();
  };

  await navegar();
}

iniciar().catch((e) => mensaje(e.message, true));
