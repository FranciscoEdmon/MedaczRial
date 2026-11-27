export const menus = {
  administrador: [
    ['usuarios', 'Gestión de usuarios'],
    ['hospitales', 'Hospitales'],
    ['solicitudes', 'Solicitudes'],
    ['historial', 'Historial'],
  ],
  hospital: [
    ['equipos', 'Equipos médicos'],
    ['solicitudes', 'Solicitudes'],
    ['historial', 'Historial'],
  ],
  ingeniero: [
    ['solicitudes', 'Mis solicitudes'],
    ['historial', 'Mi historial'],
  ],
};

export function opcionesMenu(rol) {
  return [...menus[rol], ['cuenta', 'Mi cuenta']];
}
