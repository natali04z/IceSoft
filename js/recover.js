document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('recoveryForm');
  if (!form) return;

  // Envío del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('recoveryEmail').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();

    if (!email || !newPassword) {
      alert("El correo y la nueva contraseña son obligatorios");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Contraseña actualizada exitosamente");
        form.reset();

        // Si tienes una función para mostrar el login, la puedes dejar así:
        if (typeof showLoginForm === 'function') {
          showLoginForm();
        }
      } else {
        alert(result.message || "No se pudo restablecer la contraseña");
      }
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error);
      alert("Error de conexión con el servidor");
    }
  });

  // Confirmar antes de volver al login
  const returnLink = document.getElementById('returnToLoginLink');
  if (returnLink) {
    returnLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Ir directamente al login sin confirmación
      if (typeof showLoginForm === 'function') {
        showLoginForm();
      }
    });
  }
});
