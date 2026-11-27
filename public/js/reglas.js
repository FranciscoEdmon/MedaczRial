const reglasMedacz = (() => {
  const limites = Object.freeze({
    nombreMin: 2,
    nombreMax: 120,
    usuarioMin: 3,
    usuarioMax: 40,
    claveMin: 12,
    claveMax: 128,
    claveBytes: 72,
    hospitalMax: 140,
    equipoMax: 150,
    textoLargoMax: 3000,
    campoPanelMax: 160,
    idMax: 4294967295,
    paginaMax: 100000,
    solicitudesPorPagina: 50,
  });
  const imagenSolicitud = Object.freeze({ tipos: Object.freeze(['image/jpeg', 'image/png']), maxBytes: 2 * 1024 * 1024 });
  const regexUsuario = new RegExp('^[a-z0-9._-]{' + limites.usuarioMin + ',' + limites.usuarioMax + '}$');
  const regexClave = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{' + limites.claveMin + ',' + limites.claveMax + '}$');

  const camposPersona = Object.freeze(['nombre', 'apellido_paterno', 'apellido_materno']);
  const camposEquipo = Object.freeze(['nombre', 'tipo', 'marca', 'modelo', 'serie']);
  const rolesAlta = Object.freeze(['hospital', 'ingeniero']);
  const estadosEquipo = Object.freeze(['Operativo', 'En mantenimiento', 'Fuera de servicio']);
  const tiposServicio = Object.freeze(['Preventivo', 'Correctivo', 'Revisión']);
  const actividades = Object.freeze([
    'Inspección visual',
    'Revisión de conexiones',
    'Limpieza exterior',
    'Verificación de accesorios',
    'Prueba de funcionamiento',
  ]);
  const noCumple = 'No cumple';
  const resultadosChecklist = Object.freeze(['Cumple', noCumple, 'No aplica']);
  const estadosSolicitud = Object.freeze({
    pendiente: 'pendiente',
    enProceso: 'en proceso',
    finalizado: 'finalizado',
    abortado: 'abortado',
  });
  const { pendiente, enProceso, finalizado, abortado } = estadosSolicitud;
  const estadosPorVista = Object.freeze({
    activas: Object.freeze([pendiente, enProceso]),
    historial: Object.freeze([finalizado, abortado]),
    todas: Object.freeze(Object.values(estadosSolicitud)),
  });
  const estadosTransicion = Object.freeze([abortado, enProceso, finalizado]);

  const faltaAnomalia = (resultado, anomalia) => resultado === noCumple && !anomalia.trim();
  const fechasInvertidas = (desde, hasta) => Boolean(desde && hasta && desde > hasta);

  const persona = /^[\p{L}][\p{L}\p{M}]*(?:[ '’\-][\p{L}][\p{L}\p{M}]*)*$/u;
  const etiqueta = /^(?=.*\p{L})[\p{L}\p{N}][\p{L}\p{M}\p{N} .,&'’()/+\-]*$/u;
  const codigo = /^[\p{L}\p{N}][\p{L}\p{N} ._+/\-]*$/u;
  function error(formulario, campo, valor) {
    const texto = valor.trim().normalize('NFC');
    if (formulario === 'usuario' && camposPersona.includes(campo)) {
      if (texto.length < limites.nombreMin || texto.length > limites.nombreMax || !persona.test(texto))
        return 'Escribe de ' + limites.nombreMin + ' a ' + limites.nombreMax + ' caracteres con letras. Puedes separar nombres con espacios, guiones o apóstrofos.';
    }
    if (formulario === 'equipo' || formulario === 'hospital') {
      const max = formulario === 'hospital' ? limites.hospitalMax : limites.equipoMax;
      const esCodigo = campo === 'modelo' || campo === 'serie';
      if (texto.length > max || !(esCodigo ? codigo : etiqueta).test(texto))
        return esCodigo ? 'Introduce un código alfanumérico válido.' : 'Incluye al menos una letra y usa caracteres de nombre válidos.';
    }
    return '';
  }
  return {
    imagenSolicitud, limites, regexUsuario, regexClave, camposPersona, camposEquipo, rolesAlta, estadosEquipo,
    tiposServicio, actividades, resultadosChecklist, estadosSolicitud, estadosPorVista,
    estadosTransicion, faltaAnomalia, fechasInvertidas, error,
  };
})();
if (typeof module !== 'undefined') module.exports = reglasMedacz;
