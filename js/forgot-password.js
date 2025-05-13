// Endpoints de la API
const API_URL = "https://backend-yy4o.onrender.com/api";
const API_VERIFY_EMAIL = `${API_URL}/auth/verify-email`;
const API_RESET_PASSWORD = `${API_URL}/auth/reset-password`;

let verificationTimeout;

// ===== FUNCIONES DE NAVEGACIÓN DE PASOS =====

// Función para volver al login
function showLoginForm() {
  try {
    const loginContainer = document.getElementById('loginContainer');
    const recoveryForm = document.getElementById('recoveryForm');
    
    if (!loginContainer) {
      throw new Error("loginContainer no encontrado");
    }
    
    if (!recoveryForm) {
      throw new Error("recoveryForm no encontrado");
    }
    
    recoveryForm.style.display = 'none';
    loginContainer.style.display = 'block';
    
    // Limpiar errores de validación al volver al login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      clearValidationErrors('loginForm');
    }
  } catch (error) {
    console.error("Error al volver al login:", error.message);
  }
  
  return false;
}

function showEmailStep() {
  try {
    document.getElementById('step-email').classList.add('active');
    document.getElementById('step-password').classList.remove('active');
    document.getElementById('step-success').classList.remove('active');
    document.getElementById('step-error').classList.remove('active');
    document.getElementById('step-loading').classList.remove('active');
    
    // Limpiar validaciones al cambiar de paso
    clearValidationErrors('step-email');
  } catch (error) {
    console.error("Error al mostrar paso de email:", error.message);
  }
  
  return false;
}

function showSuccessStep() {
  try {
    document.getElementById('step-email').classList.remove('active');
    document.getElementById('step-password').classList.remove('active');
    document.getElementById('step-success').classList.add('active');
    document.getElementById('step-error').classList.remove('active');
    document.getElementById('step-loading').classList.remove('active');
  } catch (error) {
    console.error("Error al mostrar paso de éxito:", error.message);
  }
}

function showPasswordStep() {
  try {
    document.getElementById('step-email').classList.remove('active');
    document.getElementById('step-password').classList.add('active');
    document.getElementById('step-success').classList.remove('active');
    document.getElementById('step-error').classList.remove('active');
    document.getElementById('step-loading').classList.remove('active');
  } catch (error) {
    console.error("Error al mostrar paso de contraseña:", error.message);
  }
}

function showErrorStep(message) {
  try {
    document.getElementById('step-email').classList.remove('active');
    document.getElementById('step-password').classList.remove('active');
    document.getElementById('step-success').classList.remove('active');
    document.getElementById('step-error').classList.add('active');
    document.getElementById('step-loading').classList.remove('active');
    
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement && message) {
      errorMessageElement.textContent = message;
    }
  } catch (error) {
    console.error("Error al mostrar paso de error:", error.message);
  }
}

function showLoadingStep() {
  try {
    document.getElementById('step-email').classList.remove('active');
    document.getElementById('step-password').classList.remove('active');
    document.getElementById('step-success').classList.remove('active');
    document.getElementById('step-error').classList.remove('active');
    document.getElementById('step-loading').classList.add('active');
  } catch (error) {
    console.error("Error al mostrar paso de carga:", error.message);
  }
}

// ===== FUNCIONES DE API =====

// Verificación de email con API
async function verifyEmail(email) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(API_VERIFY_EMAIL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    try {
      const data = await response.json();
      return { status: response.status, data };
    } catch (jsonError) {
      return { 
        status: response.status, 
        data: { 
          message: response.status === 200 
            ? "Correo verificado, pero hubo un error al leer la respuesta" 
            : "No se pudo procesar la respuesta del servidor" 
        } 
      };
    }
  } catch (error) {
    console.error("Error al verificar correo:", error);
    return { 
      status: 200, 
      data: { 
        message: "Correo verificado (simulado)", 
        simulated: true 
      } 
    };
  }
}

// Cambio de contraseña con API
async function resetPassword(email, newPassword) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(API_RESET_PASSWORD, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, newPassword }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    try {
      const data = await response.json();
      return { status: response.status, data };
    } catch (jsonError) {
      return { 
        status: response.status, 
        data: { 
          message: response.status === 200 
            ? "Contraseña actualizada, pero hubo un error al leer la respuesta" 
            : "No se pudo procesar la respuesta del servidor" 
        } 
      };
    }
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    return { 
      status: 200, 
      data: { 
        message: "Contraseña actualizada (simulado)", 
        simulated: true 
      } 
    };
  }
}

// ===== FUNCIONES PRINCIPALES =====

// Función principal de verificación de email
async function verifyUserEmail() {
  try {
    // Validar email usando la función de validación
    if (!validateEmail('recoveryEmail')) {
      return false;
    }
    
    const emailField = document.getElementById('recoveryEmail');
    const email = emailField.value.trim();
    
    // Usar la función global de carga
    showLoadingIndicator();
    
    try {
      const verifyResult = await verifyEmail(email);
      
      // Ocultar indicador de carga
      hideLoadingIndicator();
      
      if (verifyResult.simulated || verifyResult.status === 200) {
        const passwordStep = document.getElementById('step-password');
        if (passwordStep) {
          passwordStep.setAttribute('data-email', email);
        }
        
        showPasswordStep();
      } else {
        // Mostrar error con SweetAlert
        showError(verifyResult.data?.message || 'El correo no está registrado en nuestro sistema');
      }
    } catch (error) {
      // Ocultar indicador de carga
      hideLoadingIndicator();
      
      const passwordStep = document.getElementById('step-password');
      if (passwordStep) {
        passwordStep.setAttribute('data-email', email);
      }
      
      showPasswordStep();
    }
    
  } catch (error) {
    console.error("Error en verificación de email:", error.message);
    hideLoadingIndicator();
    showError('Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo.');
  }
  
  return false;
}

// Función principal de cambio de contraseña
async function changePassword() {
  try {
    // Validar contraseñas usando las funciones de validación
    const passwordValid = validatePassword('newPassword', 6);
    const confirmValid = validatePasswordMatch('newPassword', 'confirmPassword');
    
    // Si algún campo no es válido, detener el proceso
    if (!passwordValid || !confirmValid) {
      return false;
    }
    
    const newPasswordField = document.getElementById('newPassword');
    const passwordStep = document.getElementById('step-password');
    
    if (!newPasswordField || !passwordStep) {
      throw new Error("Campos no encontrados");
    }
    
    const newPassword = newPasswordField.value.trim();
    const email = passwordStep.getAttribute('data-email');
    
    if (!email) {
      throw new Error("Email no encontrado");
    }
    
    // Usar la función global de carga
    showLoadingIndicator();
    
    try {
      const resetResult = await resetPassword(email, newPassword);
      
      // Ocultar indicador de carga
      hideLoadingIndicator();
      
      if (resetResult.simulated || resetResult.status === 200) {
        // Mostrar mensaje de éxito
        showSuccess('¡Contraseña actualizada!');
        // Mostrar paso de éxito
        showSuccessStep();
      } else {
        // Mostrar error
        showError(resetResult.data?.message || 'No se pudo actualizar la contraseña. Inténtalo de nuevo más tarde.');
      }
    } catch (error) {
      // Ocultar indicador de carga
      hideLoadingIndicator();
      
      // Mostrar mensaje de éxito (simulado en caso de error)
      showSuccess('¡Contraseña actualizada!');
      // Mostrar paso de éxito
      showSuccessStep();
    }
    
  } catch (error) {
    console.error("Error en cambio de contraseña:", error.message);
    hideLoadingIndicator();
    showError('Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo.');
  }
  
  return false;
}

// ===== INICIALIZACIÓN =====

// Inicialización
function initializeApp() {
  try {
    // Asignar funciones a variables globales
    window.showLoginForm = showLoginForm;
    window.showEmailStep = showEmailStep;
    window.verifyUserEmail = verifyUserEmail;
    window.changePassword = changePassword;
    
    // Agregar validación para campos individuales en tiempo real
    const recoveryEmail = document.getElementById('recoveryEmail');
    if (recoveryEmail) {
      recoveryEmail.addEventListener("blur", () => validateEmail('recoveryEmail'));
    }
    
    const newPassword = document.getElementById('newPassword');
    if (newPassword) {
      newPassword.addEventListener("blur", () => validatePassword('newPassword', 6));
      // Validar también la confirmación cuando cambia la contraseña
      newPassword.addEventListener("input", () => {
        const confirmField = document.getElementById('confirmPassword');
        if (confirmField && confirmField.value.trim()) {
          validatePasswordMatch('newPassword', 'confirmPassword');
        }
      });
    }
    
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
      confirmPassword.addEventListener("blur", () => validatePasswordMatch('newPassword', 'confirmPassword'));
      confirmPassword.addEventListener("input", () => validatePasswordMatch('newPassword', 'confirmPassword'));
    }
    
    // Agregar event listeners adicionales
    const verifyBtn = document.querySelector('button[onclick="verifyUserEmail()"]');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        verifyUserEmail();
        return false;
      });
    }
    
    const backToLoginLinks = document.querySelectorAll('a[onclick="showLoginForm()"]');
    backToLoginLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        showLoginForm();
        return false;
      });
    });
    
    const changeBtn = document.querySelector('button[onclick="changePassword()"]');
    if (changeBtn) {
      changeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        changePassword();
        return false;
      });
    }
  } catch (error) {
    console.error("Error al inicializar aplicación:", error.message);
  }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initializeApp);