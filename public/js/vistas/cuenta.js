import { estado, panel, roles, reglas } from '../estado.js';
import { api } from '../utils/api.js';
import { esc } from '../utils/esc.js';
import { field } from '../ui/campos.js';
import { bind, form } from '../ui/form.js';
import { card } from '../ui/tabla.js';
import { vincularCancelacion } from '../ui/dialogos.js';

const { limites } = reglas;

export async function miCuenta() {
  const perfil = [
    ['Nombre', estado.cuenta.nombre],
    ['Apellido paterno', estado.cuenta.apellido_paterno || 'No registrado'],
    ['Apellido materno', estado.cuenta.apellido_materno || 'No registrado'],
    ['Nombre de usuario', estado.cuenta.usuario],
    ['Rol', roles[estado.cuenta.rol]],
    ['Hospital', estado.cuenta.hospital_nombre || 'No asignado'],
    ['Estado', estado.cuenta.activo ? 'Activa' : 'Inactiva'],
  ];

  panel.innerHTML =
    card(`
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 class="h5 mb-1">Información del perfil</h2>
            <p class="small text-body-secondary mb-0">Consulta los datos asociados a tu cuenta.</p>
          </div>
          <button class="btn btn-primary" type="button" data-dialog="#modal-clave">Cambiar contraseña</button>
        </div>
        <dl class="row gy-2 mb-0">
          ${perfil
          .map(
            ([etiqueta, valor]) =>
              `<dt class="col-12 col-sm-4 text-body-secondary fw-normal">${esc(etiqueta)}</dt><dd class="col-12 col-sm-8 text-break mb-1">${esc(valor)}</dd>`
          )
          .join('')}
        </dl>
      `) +
    `
      <dialog class="modal" id="modal-clave" tabindex="-1" aria-labelledby="titulo-modal-clave">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h2 class="modal-title fs-5" id="titulo-modal-clave">Cambiar contraseña</h2>
                <p class="small text-body-secondary mb-0">Confirma tu contraseña actual y escribe una nueva.</p>
              </div>
            </div>
            <div class="modal-body">
              ${form(
              'clave',
              field('anterior', 'Contraseña actual', '', 'password') +
                field('nueva', `Nueva contraseña (mínimo ${limites.claveMin} caracteres)`, '', 'password') +
                field('confirmacion', 'Confirmar nueva contraseña', '', 'password'),
              'Actualizar contraseña',
              'clave'
            )}
            </div>
          </div>
        </div>
      </dialog>`;

  const modalElement = document.getElementById('modal-clave');
  vincularCancelacion(modalElement, 'clave', () => document.getElementById('clave').reset());

  bind('clave', async (d) => {
    if (d.nueva !== d.confirmacion) {
      throw Error('La confirmación no coincide con la nueva contraseña.');
    }
    await api('/cuenta/clave', 'PATCH', d);
    location.assign('/login.html');
  });
}
