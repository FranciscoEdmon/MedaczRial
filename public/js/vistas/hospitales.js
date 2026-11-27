import { panel, reglas } from '../estado.js';
import { api } from '../utils/api.js';
import { esc } from '../utils/esc.js';
import { mensaje } from '../utils/mensajes.js';
import { field } from '../ui/campos.js';
import { bind, form } from '../ui/form.js';
import { btn, card, table } from '../ui/tabla.js';
import { cerrarModal, vincularCancelacion } from '../ui/dialogos.js';

const { limites } = reglas;

export async function hospitales() {
  const rows = await api('/hospitales');
  panel.innerHTML =
    card(`
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h2 class="h5 mb-1">Hospitales registrados</h2>
            <p class="small text-body-secondary mb-0">Consulta y registra los hospitales disponibles.</p>
          </div>
          <button class="btn btn-primary" type="button" data-dialog="#modal-hospital">Hospital Nuevo</button>
        </div>
        <div class="mt-4">
          ${table(
          ['Identificador', 'Nombre del hospital', 'Acciones'],
          rows.map((x) => [esc(x.identificador), esc(x.nombre), btn('Eliminar', 'borrar-hospital', x.identificador)])
        )}
        </div>
      `) +
    `
      <dialog class="modal" id="modal-hospital" tabindex="-1" aria-labelledby="titulo-modal-hospital">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h2 class="modal-title fs-5" id="titulo-modal-hospital">Hospital Nuevo</h2>
                <p class="small text-body-secondary mb-0">Registra el nombre del hospital.</p>
              </div>
            </div>
            <div class="modal-body">
              ${form('hospital', field('nombre', 'Nombre del hospital', '', 'text', true, limites.hospitalMax), 'Guardar hospital', 'hospital')}
            </div>
          </div>
        </div>
      </dialog>`;

  const modalElement = document.getElementById('modal-hospital');
  vincularCancelacion(modalElement, 'hospital', () => hospitales().catch((error) => mensaje(error.message, true)));

  bind('hospital', async (data) => {
    await api('/hospitales', 'POST', data);
    await cerrarModal(modalElement);
    await hospitales();
    mensaje('Hospital registrado.');
  });
}
