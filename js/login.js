document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            showValidation("El correo y la contraseña son obligatorios");
            return;
        }

        try {
            const response = await fetch('https://backend-icesoft.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                await showSuccess("Inicio de sesión exitoso");
                localStorage.setItem('token', result.token);
                window.location.href = "home.html";
            } else {
                showError(result.message || "Credenciales inválidas");
            }
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            showError("Error de conexión con el servidor");
        }
    });
});