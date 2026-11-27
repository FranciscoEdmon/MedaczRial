import { panel, reglas } from '../estado.js';
import { api } from '../utils/api.js';
import { esc } from '../utils/esc.js';
import { mensaje } from '../utils/mensajes.js';
import { field, select } from '../ui/campos.js';
import { bind, form } from '../ui/form.js';
import { btn, card, table } from '../ui/tabla.js';
import { cerrarModal, vincularCancelacion } from '../ui/dialogos.js';

const { camposEquipo, estadosEquipo } = reglas;

export async function equipos(edit) {
  const rows = await api('/equipos');
  const equipo = rows.find((x) => x.identificador === edit);

  panel.innerHTML =
    card(`
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 class="h5 mb-1">Equipos registrados</h2>
            <p class="small text-body-secondary mb-0">Consulta y administra los equipos médicos de tu hospital.</p>
          </div>
          <button class="btn btn-primary" type="button" data-dialog="#modal-equipo">Equipo Nuevo</button>
        </div>
        <label class="form-label">Buscar equipo<input id="buscar-equipo" class="form-control bg-white" type="search" placeholder="Serie, nombre o marca"></label>
        <div id="inventario"></div>
      `) +
    `
      <dialog class="modal" id="modal-equipo" tabindex="-1" aria-labelledby="titulo-modal-equipo">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h2 class="modal-title fs-5" id="titulo-modal-equipo">${equipo ? 'Editar equipo' : 'Equipo Nuevo'}</h2>
                <p class="small text-body-secondary mb-0">Completa la información del equipo médico.</p>
              </div>
            </div>
            <div class="modal-body">
              ${form(
              'equipo',
              camposEquipo
                .map((k) =>
                  field(
                    k,
                    {
                      nombre: 'Nombre del equipo',
                      tipo: 'Tipo',
                      marca: 'Marca',
                      modelo: 'Modelo',
                      serie: 'Número de serie',
                    }[k],
                    equipo?.[k]
                  )
                )
                .join('') +
                select('estado', 'Estado', estadosEquipo, equipo?.estado),
              'Guardar equipo',
              'equipo'
            )}
            </div>
          </div>
        </div>
      </dialog>`;

  const dibujarInventario = () => {
    const q = document.getElementById('buscar-equipo').value.trim().toLowerCase();
    const resultados = rows.filter((x) =>
      camposEquipo.some((k) => String(x[k] ?? '').toLowerCase().includes(q))
    );
    document.getElementById('inventario').innerHTML = table(
      ['Equipo', 'Tipo', 'Serie', 'Marca / modelo', 'Estado', 'Acciones'],
      resultados.map((x) => [
        esc(x.nombre),
        esc(x.tipo),
        esc(x.serie),
        esc([x.marca, x.modelo].filter(Boolean).join(' / ')),
        esc(x.estado),
        btn('Editar', 'editar-equipo', x.identificador) + btn('Eliminar', 'borrar-equipo', x.identificador),
      ])
    );
  };

  document.getElementById('buscar-equipo').oninput = dibujarInventario;
  dibujarInventario();

  const modalElement = document.getElementById('modal-equipo');
  vincularCancelacion(modalElement, 'equipo', () => equipos().catch((error) => mensaje(error.message, true)));

  bind('equipo', async (d) => {
    if (equipo) d.version = equipo.version;
    await api('/equipos' + (equipo ? '/' + equipo.identificador : ''), equipo ? 'PATCH' : 'POST', d);
    await cerrarModal(modalElement);
    await equipos();
    mensaje(equipo ? 'Equipo actualizado.' : 'Equipo registrado.');
  });

  if (equipo) modalElement.showModal();
}
