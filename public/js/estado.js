/* global reglasMedacz */

export const panel = document.getElementById('paneles');
export const aviso = document.getElementById('estado-carga');

export const roles = {
  administrador: 'Administrador',
  hospital: 'Gerente de Hospital',
  ingeniero: 'Ingeniero',
};

export const reglas = reglasMedacz;
export const { actividades } = reglas;

export const estado = {
  cuenta: undefined,
  pagina: 1,
  filtrosSolicitud: {},
};
