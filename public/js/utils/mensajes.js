import { aviso } from '../estado.js';

export function mensaje(texto, error = false, advertencia = false) {
  const modalBody = document.querySelector('.modal[open] .modal-body');
  if (modalBody) {
    let box = modalBody.querySelector('.aviso-modal');
    if (!box) {
      box = document.createElement('div');
      modalBody.prepend(box);
    }
    box.className =
      'aviso-modal alert ' +
      (error ? 'alert-danger' : advertencia ? 'alert-warning' : 'alert-success');
    box.setAttribute('role', error || advertencia ? 'alert' : 'status');
    box.textContent = texto;
    return;
  }
  aviso.hidden = false;
  aviso.className =
    'alert ' +
    (error ? 'alert-danger' : advertencia ? 'alert-warning' : 'alert-success');
  aviso.textContent = texto;
}
