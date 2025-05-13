// Endpoints de la API
const API_BASE_URL = "https://backend-yy4o.onrender.com/api";
const API_PROFILE = `${API_BASE_URL}/users/profile/me`;

// Variable global para almacenar los datos del perfil
let userProfile = null;

// Función para validar un campo y mostrar error
function validateField(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = errorMessage || "El campo es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar teléfono
function validatePhone(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El teléfono es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!/^\d+$/.test(field.value.trim())) {
    errorElement.textContent = "El teléfono debe contener solo dígitos.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar email
function validateEmail(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!field.value.trim()) {
    errorElement.textContent = "El correo es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!emailRegex.test(field.value.trim())) {
    errorElement.textContent = "El formato del correo electrónico no es válido.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Limpiar mensajes de error
function clearValidationErrors(formId) {
  const form = document.getElementById(formId);
  const errorElements = form.querySelectorAll('.error-message');
  const inputElements = form.querySelectorAll('.field-element');
  
  errorElements.forEach(element => {
    element.style.display = "none";
  });
  
  inputElements.forEach(element => {
    element.classList.remove("input-error");
  });
}

// Desactivar validación nativa del navegador en los formularios
function disableNativeBrowserValidation() {
  // Desactivar validación del formulario de perfil
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = profileForm.querySelectorAll("input");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
}

// Validación de campos numéricos
function setupNumericValidation() {
  const phoneInput = document.getElementById('editProfileContact');
  
  if (phoneInput) {
    phoneInput.addEventListener('keypress', function(e) {
      if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    phoneInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '');
    });
  }
}

// Manejo de modales
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
    
    // Resetear mensajes de error al abrir el modal
    if (modalId === 'editProfileModal') {
      clearValidationErrors('profileForm');
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

// Cargar perfil del usuario
const loadProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    showLoadingIndicator();
    
    const res = await fetch(API_PROFILE, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    hideLoadingIndicator();
    
    if (res.ok) {
      userProfile = data;
      displayProfile(userProfile);
      
      // Actualizar el nombre en el encabezado del perfil
      const profileHeaderName = document.getElementById('profileHeaderName');
      if (profileHeaderName) {
        profileHeaderName.textContent = userProfile.name || 'Usuario';
      }
      
      // Actualizar el nombre en el navbar
      const loggedUserName = document.getElementById('loggedUserName');
      if (loggedUserName) {
        loggedUserName.textContent = userProfile.name || 'Usuario';
      }
    } else {
      showError(data.message || "Error al cargar el perfil de usuario.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al cargar el perfil: " + (err.message || err));
  }
};

// Mostrar datos del perfil en la interfaz
const displayProfile = (profile) => {
  if (!profile) return;
  
  document.getElementById('profileName').textContent = profile.name || 'No disponible';
  document.getElementById('profileLastname').textContent = profile.lastname || 'No disponible';
  document.getElementById('profileContact').textContent = profile.contact_number || 'No disponible';
  document.getElementById('profileEmail').textContent = profile.email || 'No disponible';
  document.getElementById('profileRole').textContent = profile.role?.name || 'No asignado';
  
  // Mostrar el estado como un switch desactivado
  const statusElement = document.getElementById('profileStatus');
  if (statusElement) {
    statusElement.innerHTML = `
      <label class="switch">
        <input type="checkbox" ${profile.status === "active" ? "checked" : ""} disabled>
        <span class="slider round"></span>
      </label>
    `;
  }
};

// Abrir modal de edición
const openEditProfileModal = () => {
  if (!userProfile) {
    showError("No se ha cargado la información del perfil");
    return;
  }
  
  // Limpiar mensajes de validación
  clearValidationErrors('profileForm');
  
  document.getElementById('editProfileName').value = userProfile.name || '';
  document.getElementById('editProfileLastname').value = userProfile.lastname || '';
  document.getElementById('editProfileContact').value = userProfile.contact_number || '';
  document.getElementById('editProfileEmail').value = userProfile.email || '';
  
  openModal('editProfileModal');
};

// Actualizar perfil
const updateProfile = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  // Validar campos usando las nuevas funciones
  const nameValid = validateField("editProfileName", "El nombre es obligatorio.");
  const lastnameValid = validateField("editProfileLastname", "El apellido es obligatorio.");
  const phoneValid = validatePhone("editProfileContact");
  const emailValid = validateEmail("editProfileEmail");

  // Si algún campo no es válido, detener el proceso
  if (!nameValid || !lastnameValid || !phoneValid || !emailValid) {
    return;
  }
  
  const name = document.getElementById('editProfileName').value.trim();
  const lastname = document.getElementById('editProfileLastname').value.trim();
  const contact_number = document.getElementById('editProfileContact').value.trim();
  const email = document.getElementById('editProfileEmail').value.trim();
  
  try {
    
    const res = await fetch(API_PROFILE, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        lastname,
        contact_number,
        email
      })
    });
    
    const data = await res.json();
        
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Perfil actualizado correctamente.`,
        showConfirmButton: true,
      });
      closeModal('editProfileModal');
      
      userProfile = data.user;
      displayProfile(userProfile);
      
      const loggedUserName = document.getElementById('loggedUserName');
      if (loggedUserName) {
        loggedUserName.textContent = userProfile.name || 'Usuario';
      }
    } else {
      showError(data.message || "Error al actualizar el perfil");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al actualizar el perfil: " + (err.message || err));
  }
};

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  // Desactivar validación nativa del navegador
  disableNativeBrowserValidation();
  
  loadProfile();
  setupNumericValidation();
  
  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openEditProfileModal);
  }
  
  const updateProfileBtn = document.getElementById('updateProfileBtn');
  if (updateProfileBtn) {
    updateProfileBtn.addEventListener('click', updateProfile);
  }
  
  // Agregar validación para campos individuales en tiempo real
  const editProfileName = document.getElementById('editProfileName');
  if (editProfileName) {
    editProfileName.addEventListener('blur', () => validateField('editProfileName', 'El nombre es obligatorio.'));
  }
  
  const editProfileLastname = document.getElementById('editProfileLastname');
  if (editProfileLastname) {
    editProfileLastname.addEventListener('blur', () => validateField('editProfileLastname', 'El apellido es obligatorio.'));
  }
  
  const editProfileContact = document.getElementById('editProfileContact');
  if (editProfileContact) {
    editProfileContact.addEventListener('blur', () => validatePhone('editProfileContact'));
  }
  
  const editProfileEmail = document.getElementById('editProfileEmail');
  if (editProfileEmail) {
    editProfileEmail.addEventListener('blur', () => validateEmail('editProfileEmail'));
  }
});

// Funciones globales
window.openModal = openModal;
window.closeModal = closeModal;