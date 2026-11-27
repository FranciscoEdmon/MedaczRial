import { estado, roles, panel, reglas } from '../estado.js';
import { api } from '../utils/api.js';
import { esc } from '../utils/esc.js';
import { mensaje } from '../utils/mensajes.js';
import { field, passwordField, select } from '../ui/campos.js';
import { bind, form } from '../ui/form.js';
import { btn, card, table } from '../ui/tabla.js';
import { cerrarModal, vincularCancelacion } from '../ui/dialogos.js';

const { limites, regexUsuario, regexClave, camposPersona, rolesAlta } = reglas;

export async function usuarios(edit) {
  const [users, hospitales] = await Promise.all([api('/usuarios'), api('/hospitales')]);
  const u = users.find((x) => x.identificador === edit);
  const nombreCompleto = (x) =>
    x.nombre_completo || [x.nombre, x.apellido_paterno, x.apellido_materno].filter(Boolean).join(' ');

  panel.innerHTML =
    card(`
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 class="h5 mb-1">Usuarios registrados</h2>
            <p class="small text-body-secondary mb-0">Consulta y administra los datos y permisos de cada usuario.</p>
          </div>
          <button class="btn btn-primary" type="button" data-dialog="#modal-usuario">Usuario Nuevo</button>
        </div>
        <div id="tabla-usuarios"></div>
      `) +
    `
      <dialog class="modal" id="modal-usuario" tabindex="-1" aria-labelledby="titulo-modal-usuario">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h2 class="modal-title fs-5" id="titulo-modal-usuario">${u ? 'Editar usuario' : 'Usuario Nuevo'}</h2>
                <p class="small text-body-secondary mb-0">Completa los datos de acceso y el rol correspondiente.</p>
              </div>
            </div>
            <div class="modal-body">
              ${form(
              'usuario',
              field('nombre', 'Nombre', u?.nombre, 'text', true, limites.nombreMax) +
                field('apellido_paterno', 'Apellido paterno', u?.apellido_paterno, 'text', !u || Boolean(u?.apellido_paterno), limites.nombreMax) +
                field('apellido_materno', 'Apellido materno', u?.apellido_materno, 'text', !u || Boolean(u?.apellido_materno), limites.nombreMax) +
                field('usuario', 'Nombre de usuario', u?.usuario) +
                passwordField('clave', u ? 'Nueva contraseña (opcional)' : `Contraseña inicial (mínimo ${limites.claveMin} caracteres)`, !u) +
                (u ? '' : select('rol', 'Rol', rolesAlta.map(rol => [rol, roles[rol]]))) +
                (!u
                  ? `<div id="hospital-field" class="col-12">${select('hospital', 'Hospital', [['', 'Seleccionar'], ...hospitales.map((h) => [h.identificador, h.nombre])])}</div>`
                  : ''),
              'Guardar usuario',
              'usuario'
            )}
            </div>
          </div>
        </div>
      </dialog>`;

  const dibujarTabla = () => {
    const filas = users
      .filter((x) => x.identificador !== estado.cuenta.identificador)
      .map((x) => {
        const completo = nombreCompleto(x);
        const estado = x.activo
          ? '<span class="badge bg-success">Activo</span>'
          : '<span class="badge bg-secondary">Inactivo</span>';
        const acciones = x.activo
          ? btn('Editar', 'editar-usuario', x.identificador) +
            (x.rol !== 'administrador' ? btn('Eliminar', 'borrar-usuario', x.identificador) : '')
          : '—';

        return [
          `<span class="d-inline-flex align-items-center gap-2"><span class="avatar-inicial rounded-circle bg-primary text-white">${esc(completo.charAt(0).toUpperCase() || '?')}</span><span>${esc(completo)}</span></span>`,
          esc(x.usuario),
          esc(roles[x.rol]),
          esc(hospitales.find((h) => h.identificador === x.hospital)?.nombre || '—'),
          estado,
          acciones,
        ];
      });

    document.getElementById('tabla-usuarios').innerHTML = table(
      ['Nombre', 'Nombre de usuario', 'Rol', 'Hospital', 'Estado', 'Acciones'],
      filas
    );
  };

  dibujarTabla();

  if (!u) {
    const f = document.getElementById('usuario');
    const change = () => {
      const box = document.getElementById('hospital-field');
      box.hidden = f.elements.rol.value !== 'hospital';
      f.elements.hospital.required = !box.hidden;
    };
    f.elements.rol.onchange = change;
    change();
  }

  const f = document.getElementById('usuario');
  const alternarClave = f.querySelector('[data-mostrar-clave]');
  alternarClave.onclick = () => {
    const mostrar = f.elements.clave.type === 'password';
    f.elements.clave.type = mostrar ? 'text' : 'password';
    alternarClave.textContent = mostrar ? 'Ocultar' : 'Mostrar';
    alternarClave.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
    alternarClave.title = alternarClave.getAttribute('aria-label');
    alternarClave.setAttribute('aria-pressed', String(mostrar));
  };

  for (const campo of camposPersona) f.elements[campo].minLength = limites.nombreMin;
  f.elements.usuario.minLength = limites.usuarioMin;
  f.elements.usuario.maxLength = limites.usuarioMax;

  const validarCampo = (input) => {
    input.setCustomValidity('');
    const etiqueta = input.closest('label')?.querySelector('span')?.textContent || 'Este campo';
    if (input.validity.valueMissing) {
      input.setCustomValidity(`${etiqueta}: completa este campo.`);
    } else if (input.validity.tooShort) {
      input.setCustomValidity(`${etiqueta}: escribe al menos ${input.minLength} caracteres.`);
    } else if (
      camposPersona.includes(input.name) &&
      input.value && reglas.error('usuario', input.name, input.value)
    ) {
      input.setCustomValidity(`${etiqueta}: usa letras, espacios, guiones o apóstrofos.`);
    } else if (input.name === 'usuario' && !regexUsuario.test(input.value.trim())) {
      input.setCustomValidity(
        `Nombre de usuario: usa de ${limites.usuarioMin} a ${limites.usuarioMax} caracteres; solo letras, números, punto, guion o guion bajo.`
      );
    } else if (input.name === 'clave' && input.value && !regexClave.test(input.value)) {
      input.setCustomValidity(
        `Contraseña inicial: incluye al menos ${limites.claveMin} caracteres, una mayúscula, una minúscula, un número y un símbolo.`
      );
    }
  };

  [...f.elements]
    .filter((input) => input.name)
    .forEach((input) => {
      input.addEventListener('invalid', () => validarCampo(input));
      input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () =>
        validarCampo(input)
      );
    });

  const modalElement = document.getElementById('modal-usuario');
  vincularCancelacion(modalElement, 'usuario', () => usuarios().catch((error) => mensaje(error.message, true)));

  bind('usuario', async (data) => {
    await api('/usuarios' + (u ? '/' + u.identificador : ''), u ? 'PATCH' : 'POST', data);
    await cerrarModal(modalElement);
    await usuarios();
    mensaje('Usuario guardado.');
  });

  if (u) modalElement.showModal();
}
