(() => {
  function mostrarAcceso() {
    const contenedor = document.getElementById("login-form");
    if (!contenedor) return;
    const mensaje = document.getElementById("mensaje-acceso");
    const contrasena = contenedor.elements.contrasena;
    const alternar = contenedor.querySelector(".password-toggle");
    alternar.onclick = () => {
      const mostrar = contrasena.type === "password";
      contrasena.type = mostrar ? "text" : "password";
      alternar.textContent = mostrar ? "Ocultar" : "Ver";
      alternar.setAttribute(
        "aria-label",
        mostrar ? "Ocultar contraseña" : "Mostrar contraseña",
      );
      alternar.title = alternar.getAttribute("aria-label");
      alternar.setAttribute("aria-pressed", String(mostrar));
    };
    try {
      contenedor.elements.usuario.value =
        localStorage.getItem("medacz_usuario_recordado") || "";
      contenedor.elements.recordar.checked = Boolean(
        contenedor.elements.usuario.value,
      );
    } catch {
    }
    contenedor.onsubmit = async (evento) => {
      evento.preventDefault();
      try {
        if (contenedor.elements.recordar.checked)
          localStorage.setItem(
            "medacz_usuario_recordado",
            contenedor.elements.usuario.value.trim(),
          );
        else localStorage.removeItem("medacz_usuario_recordado");
      } catch {
      }
      mensaje.hidden = false;
      mensaje.classList.remove("alert-danger");
      mensaje.classList.add("alert-info");
      mensaje.textContent = "Validando tus credenciales…";
      const enviar = contenedor.querySelector('[type="submit"]');
      enviar.disabled = true;
      try {
        const respuesta = await fetch("/api/sesiones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario: contenedor.elements.usuario.value.trim(),
            clave: contrasena.value,
          }),
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.error || "No se pudo iniciar sesión.");
        contrasena.value = "";
        location.assign("/portal.html");
      } catch (error) {
        mensaje.classList.remove("alert-info");
        mensaje.classList.add("alert-danger");
        mensaje.textContent = error instanceof TypeError
          ? "No se pudo conectar con el servidor. Comprueba que esté iniciado."
          : error.message;
        enviar.disabled = false;
      }
    };
  }
  if (document.getElementById("login-form")) mostrarAcceso();
  else location.replace("/portal.html" + location.hash);
})();
