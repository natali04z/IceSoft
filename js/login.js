// Puntos finales de la API
const API_URL = "https://backend-yy4o.onrender.com/api";
const API_LOGIN = `${API_URL}/auth/login`;

// Debug: Interceptar todas las llamadas a Swal.fire para identificar el origen
const originalSwalFire = Swal.fire;
Swal.fire = function(...args) {
    console.log('Swal.fire llamado desde:', new Error().stack);
    console.log('Argumentos:', args);
    return originalSwalFire.apply(this, args);
};

// Validar campo y mostrar error
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

// Validar correo electrónico
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

// Validar contraseña
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
    
    // Cerrar cualquier alerta de SweetAlert
    Swal.close();
    
    const errorElements = form.querySelectorAll('.error-message');
    const inputElements = form.querySelectorAll('.field-element');
    
    errorElements.forEach(element => {
        element.textContent = "";
        element.style.display = "none";
    });
    
    inputElements.forEach(element => {
        element.classList.remove("input-error");
    });
    
    // Limpiar TODOS los posibles mensajes de error
    const credentialsError = document.getElementById('credentials-error');
    if (credentialsError) {
        credentialsError.style.display = "none";
        credentialsError.textContent = "";
    }
    
    // Buscar y limpiar cualquier otro mensaje de error que pueda existir
    const allErrorMessages = document.querySelectorAll('.error-message, .alert-danger, .text-danger, .credentials-error-message');
    allErrorMessages.forEach(element => {
        element.style.display = "none";
        element.textContent = "";
    });
}

// Mostrar mensaje de error de credenciales
function showCredentialsError(message) {
    let credentialsError = document.getElementById('credentials-error');
    if (!credentialsError) {
        credentialsError = document.createElement('div');
        credentialsError.id = 'credentials-error';
        credentialsError.className = 'error-message credentials-error-message';
        const form = document.getElementById('loginForm');
        const actionsDiv = form.querySelector('.recovery-actions');
        form.insertBefore(credentialsError, actionsDiv);
    }
    credentialsError.textContent = message || "Credenciales incorrectas. Por favor, verifique su correo electrónico y contraseña.";
    credentialsError.style.display = "block";
}

// Función para manejar diferentes tipos de errores del backend
function handleLoginError(status, backendMessage) {

    clearAllErrors();

    switch (status) {
        case 400:
            showError("Por favor, complete todos los campos requeridos.");
            break;
        case 401:
            showError("Credenciales incorrectas. Por favor, verifique su correo electrónico y contraseña.");
            break;
        case 403:
            if (backendMessage && backendMessage.includes("inactive") && backendMessage.includes("account")) {
                showInfo("Su cuenta está inactiva. Por favor, contacte al administrador para activar su cuenta.");
            } else if (backendMessage && backendMessage.includes("no role assigned")) {
                showError("Su cuenta no tiene un rol asignado. Por favor, contacte al administrador para asignar un rol.");
            } else if (backendMessage && backendMessage.includes("role") && backendMessage.includes("inactive")) {
                showError("Su rol está actualmente inactivo. Por favor, contacte al administrador para activar su rol.");
            } else {
                showInfo("Acceso denegado. Por favor, contacte al administrador.");
            }
            break;
        case 500:
            showError("Error interno del servidor. Por favor, intente más tarde.");
            break;
        default:
            showError("Ha ocurrido un error inesperado. Por favor, intente nuevamente.");
    }
}

// Función adicional para limpiar TODOS los errores posibles
function clearAllErrors() {
    Swal.close();
    
    const credentialsError = document.getElementById('credentials-error');
    if (credentialsError) {
        credentialsError.style.display = "none";
        credentialsError.textContent = "";
        credentialsError.innerHTML = "";
    }
    
    const errorSelectors = [
        '.error-message',
        '.alert-danger', 
        '.text-danger',
        '.credentials-error-message',
        '.text-red-500',
        '.text-error',
        '.error-text',
        '.field-error',
        '.form-error',
        '[class*="error"]',
        '[style*="color: red"]',
        '[style*="color:red"]'
    ];
    
    errorSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent.toLowerCase();
                if (text.includes('inactive') || 
                    text.includes('administrator') ||
                    text.includes('credentials') ||
                    text.includes('invalid') ||
                    text.includes('error') ||
                    text.includes('contact')) {
                    element.style.display = "none";
                    element.textContent = "";
                    element.innerHTML = "";
                    element.remove();
                }
            });
        } catch (e) {
        }
    });
    
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        const text = node.textContent.toLowerCase();
        if (text.includes('your account is inactive') || 
            text.includes('please contact an administrator')) {
            textNodes.push(node);
        }
    }
    
    // Remover nodos de texto problemáticos
    textNodes.forEach(textNode => {
        if (textNode.parentElement) {
            textNode.parentElement.style.display = "none";
            textNode.textContent = "";
        }
    });
}

// Desactivar validación nativa del navegador
function disableNativeBrowserValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.setAttribute("novalidate", "");
        const inputs = form.querySelectorAll("input");
        inputs.forEach(input => {
            input.removeAttribute("required");
            input.removeAttribute("pattern");
        });
    });
}

// Mostrar indicador de carga
function showLoading(show = true) {
    const submitButton = document.querySelector('#loginForm button[type="submit"]');
    if (submitButton) {
        if (show) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Iniciar Sesión';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    disableNativeBrowserValidation();
    
    const form = document.getElementById('loginForm');
    if (form) {
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField) {
            emailField.addEventListener('blur', () => validateEmail('email'));
            emailField.addEventListener('input', () => {
                const credentialsError = document.getElementById('credentials-error');
                if (credentialsError) credentialsError.style.display = "none";
            });
        }
        
        if (passwordField) {
            passwordField.addEventListener('blur', () => validatePassword('password'));
            passwordField.addEventListener('input', () => {
                const credentialsError = document.getElementById('credentials-error');
                if (credentialsError) credentialsError.style.display = "none";
            });
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearValidationErrors('loginForm');
            
            const emailValid = validateEmail('email');
            const passwordValid = validatePassword('password');
            
            if (!emailValid || !passwordValid) {
                return;
            }
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            showLoading(true);
            
            try {
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
                
                if (response.ok) {
                    localStorage.setItem('token', result.token);
                    
                    if (result.user) {
                        localStorage.setItem('user', JSON.stringify(result.user));
                    }
                    
                    window.location.href = "home.html";
                    
                } else {
                    e.stopImmediatePropagation();
                    
                    handleLoginError(response.status, result.message);
                    
                    return false;
                }
                
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                e.stopImmediatePropagation();
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    showError('No se pudo conectar con el servidor. Verifique su conexión a internet.');
                } else {
                    showError('Error de conexión. Por favor, intente nuevamente.');
                }
                
                return false;
            } finally {
                showLoading(false);
            }
        }, { once: false, capture: true });
    } else {
        console.error("Formulario de inicio de sesión no encontrado");
    }

    // Funciones globales para el manejo de formularios
    if (typeof window.showRecoveryForm !== 'function') {
        window.showRecoveryForm = function() {
            clearValidationErrors('loginForm');
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('recoveryForm').style.display = 'block';
            document.getElementById('step-email').classList.add('active');
            document.getElementById('step-password').classList.remove('active');
            document.getElementById('step-success').classList.remove('active');
            document.getElementById('step-error').classList.remove('active');
            document.getElementById('step-loading').classList.remove('active');
            document.getElementById('recoveryEmail').value = '';
            return false;
        }
    }
    
    if (typeof window.showLoginForm !== 'function') {
        window.showLoginForm = function() {
            clearValidationErrors('step-email');
            clearValidationErrors('step-password');
            document.getElementById('recoveryForm').style.display = 'none';
            document.getElementById('loginContainer').style.display = 'block';
            return false;
        }
    }
});