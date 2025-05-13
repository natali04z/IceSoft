// Puntos finales de la API
const API_URL = "https://backend-yy4o.onrender.com/api";
const API_LOGIN = `${API_URL}/auth/login`;

// Función para validar un campo y mostrar el error
function validateField(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (!field.value.trim()) {
        errorElement.textContent = errorMessage || "El campo es obligatorio.";
        errorElement.style.display = "block";
        field.classList.add("input-error");
        return false;
    } else {
        errorElement.textContent = "";
        errorElement.style.display = "none";
        field.classList.remove("input-error");
        return true;
    }
}

// Función para validar correo electrónico
function validateEmail(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!field.value.trim()) {
        errorElement.textContent = "El correo electrónico es obligatorio.";
        errorElement.style.display = "block";
        field.classList.add("input-error");
        return false;
    } else if (!emailRegex.test(field.value.trim())) {
        errorElement.textContent = "El formato del correo electrónico no es válido.";
        errorElement.style.display = "block";
        field.classList.add("input-error");
        return false;
    } else {
        errorElement.textContent = "";
        errorElement.style.display = "none";
        field.classList.remove("input-error");
        return true;
    }
}

// Función para validar contraseña
function validatePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (!field.value.trim()) {
        errorElement.textContent = "La contraseña es obligatoria.";
        errorElement.style.display = "block";
        field.classList.add("input-error");
        return false;
    } else {
        errorElement.textContent = "";
        errorElement.style.display = "none";
        field.classList.remove("input-error");
        return true;
    }
}

// Limpiar mensajes de error
function clearValidationErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const errorElements = form.querySelectorAll('.error-message');
    const inputElements = form.querySelectorAll('.field-element');
    
    errorElements.forEach(element => {
        element.textContent = "";
        element.style.display = "none";
    });
    
    inputElements.forEach(element => {
        element.classList.remove("input-error");
    });
    
    // Ocultar mensaje de credenciales incorrectas si existe
    const credentialsError = document.getElementById('credentials-error');
    if (credentialsError) {
        credentialsError.style.display = "none";
    }
}

// Mostrar mensaje de error de credenciales
function showCredentialsError(message) {
    // Verificar si ya existe el elemento
    let credentialsError = document.getElementById('credentials-error');
    // Si no existe, crearlo
    if (!credentialsError) {
        credentialsError = document.createElement('div');
        credentialsError.id = 'credentials-error';
        credentialsError.className = 'error-message credentials-error-message';
        const form = document.getElementById('loginForm');
        const actionsDiv = form.querySelector('.recovery-actions');
        // Insertar antes del botón
        form.insertBefore(credentialsError, actionsDiv);
    }
    // Actualizar mensaje y mostrar
    credentialsError.textContent = message || "Credenciales incorrectas. Por favor, verifique su correo electrónico y contraseña.";
    credentialsError.style.display = "block";
}

// Desactivar la validación nativa del navegador
function disableNativeBrowserValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.setAttribute("novalidate", "");
        // Eliminar los atributos 'required' y 'pattern' de los campos
        const inputs = form.querySelectorAll("input");
        inputs.forEach(input => {
            input.removeAttribute("required");
            input.removeAttribute("pattern");
        });
    });
}

// Función para mostrar errores con SweetAlert2
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message || 'Ha ocurrido un error',
        confirmButtonColor: '#2e3b52'
    });
}

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', () => {
    // Desactivar validación nativa del navegador
    disableNativeBrowserValidation();
    
    const form = document.getElementById('loginForm');
    // Verificar si el formulario existe
    if (form) {
        // Agregar validación en tiempo real para los campos
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField) {
            emailField.addEventListener('blur', () => validateEmail('email'));
            // Limpiar mensaje de error de credenciales al cambiar el correo electrónico
            emailField.addEventListener('input', () => {
                const credentialsError = document.getElementById('credentials-error');
                if (credentialsError) credentialsError.style.display = "none";
            });
        }
        
        if (passwordField) {
            passwordField.addEventListener('blur', () => validatePassword('password'));
            // Limpiar mensaje de error de credenciales al cambiar la contraseña
            passwordField.addEventListener('input', () => {
                const credentialsError = document.getElementById('credentials-error');
                if (credentialsError) credentialsError.style.display = "none";
            });
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validar campos
            const emailValid = validateEmail('email');
            const passwordValid = validatePassword('password');
            
            // Si algún campo no es válido, detener el proceso
            if (!emailValid || !passwordValid) {
                return;
            }
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            
            try {
                // Mostrar indicador de carga
                Swal.fire({
                    title: 'Procesando',
                    text: 'Verificando credenciales...',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                const response = await fetch(API_LOGIN, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                });
                
                const result = await response.json();
                
                // Procesar respuesta
                if (response.ok) {
                    await Swal.fire({
                        icon: 'success',
                        title: '¡Bienvenido!',
                        text: 'Inicio de sesión exitoso',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    // Guardar token y redireccionar
                    localStorage.setItem('token', result.token);
                    window.location.href = "home.html";
                } else {
                    // Mostrar error con SweetAlert2
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: result.message || "Credenciales inválidas",
                        confirmButtonColor: '#2e3b52'
                    });
                    
                    // Mostrar mensaje de error en el formulario
                    showCredentialsError(result.message || "Credenciales incorrectas. Por favor, verifique su correo electrónico y contraseña.");
                }
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                
                // Mostrar error con SweetAlert2
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'No se pudo conectar con el servidor',
                    confirmButtonColor: '#2e3b52'
                });
                
                // Mostrar mensaje de error en el formulario
                showCredentialsError("Error de conexión. No se pudo conectar con el servidor.");
            }
        });
    } else {
        console.error("Formulario de inicio de sesión no encontrado");
    }

    // Asegurar que la función showRecoveryForm está disponible globalmente
    if (typeof window.showRecoveryForm !== 'function') {
        console.warn("La función showRecoveryForm no está definida, estableciéndola ahora");
        window.showRecoveryForm = function() {
            // Limpiar errores de validación al cambiar de formulario
            clearValidationErrors('loginForm');
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('recoveryForm').style.display = 'block';
            // Asegurarse de que solo se muestra el paso de email
            document.getElementById('step-email').classList.add('active');
            document.getElementById('step-password').classList.remove('active');
            document.getElementById('step-success').classList.remove('active');
            document.getElementById('step-error').classList.remove('active');
            document.getElementById('step-loading').classList.remove('active');
            document.getElementById('recoveryEmail').value = '';
            return false;
        }
    }
    
    // Asegurar que la función showLoginForm está disponible globalmente
    if (typeof window.showLoginForm !== 'function') {
        console.warn("La función showLoginForm no está definida, estableciéndola ahora");
        window.showLoginForm = function() {
            // Limpiar errores de validación al cambiar de formulario
            clearValidationErrors('step-email');
            clearValidationErrors('step-password');
            document.getElementById('recoveryForm').style.display = 'none';
            document.getElementById('loginContainer').style.display = 'block';
            return false;
        }
    }
});