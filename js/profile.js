// Endpoints de la API
const API_BASE_URL = "https://backend-yy4o.onrender.com/api";
const API_PROFILE = `${API_BASE_URL}/users/profile/me`;

// Variable global para almacenar los datos del perfil
let userProfile = null;

// ===== FUNCIONES DE CARGA Y VISUALIZACIÓN =====

// Cargar perfil del usuario
const loadProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
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
      
      // Actualizar el nombre en el navbar
      updateUserNameInHeader(userProfile);
      
      // Guardar datos en localStorage para uso en otras páginas
      saveUserDataToLocalStorage(userProfile);
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
  
  // Información básica del perfil
  document.getElementById('profileName').textContent = profile.name || 'No disponible';
  document.getElementById('profileLastname').textContent = profile.lastname || 'No disponible';
  document.getElementById('profileContact').textContent = profile.contact_number || 'No disponible';
  document.getElementById('profileEmail').textContent = profile.email || 'No disponible';
  
  // Mostrar el nombre del rol (usando displayName si está disponible)
  const roleElement = document.getElementById('profileRole');
  if (roleElement) {
    let roleName = 'No asignado';
    
    if (profile.role) {
      if (typeof profile.role === 'string') {
        roleName = profile.role;
      } else if (profile.role.displayName) {
        roleName = profile.role.displayName;
      } else if (profile.role.name) {
        roleName = profile.role.name;
      }
    }
    
    roleElement.textContent = roleName;
  }
  
  // Mostrar el estado como texto
  const statusElement = document.getElementById('profileStatus');
  if (statusElement) {
    statusElement.textContent = profile.status === "active" ? "Activo" : "Inactivo";
  }
};

// Actualizar el nombre de usuario en el header
const updateUserNameInHeader = (profile) => {
  if (!profile) return;
  
  const loggedUserName = document.getElementById('loggedUserName');
  if (loggedUserName) {
    loggedUserName.textContent = `${profile.name || ''} ${profile.lastname || ''}`.trim() || 'Usuario';
  }
};

// Guardar datos del usuario en localStorage
const saveUserDataToLocalStorage = (profile) => {
  if (!profile) return;
  
  let roleName = '';
  if (profile.role) {
    if (typeof profile.role === 'string') {
      roleName = profile.role;
    } else if (profile.role.displayName) {
      roleName = profile.role.displayName;
    } else if (profile.role.name) {
      roleName = profile.role.name;
    }
  }
  
  const userData = {
    name: profile.name || '',
    lastname: profile.lastname || '',
    email: profile.email || '',
    role: roleName,
    status: profile.status || 'inactive'
  };
  
  localStorage.setItem('userData', JSON.stringify(userData));
};

// ===== FUNCIONES DE INTERFAZ DE USUARIO =====

// Función para configurar el desplegable del usuario en el header
const setupUserDropdown = () => {
  const dropdownToggle = document.getElementById("userDropdownToggle");
  const dropdownMenu = document.getElementById("userDropdownMenu");
  
  if (dropdownToggle && dropdownMenu) {
    // Toggle del menú al hacer clic
    dropdownToggle.addEventListener("click", () => {
      dropdownMenu.classList.toggle("show");
    });
    
    // Cerrar el menú al hacer clic fuera de él
    document.addEventListener("click", (event) => {
      if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.remove("show");
      }
    });
  }
};

// Función de cierre de sesión
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  window.location.href = "login.html";
};

// ===== FUNCIONES DE UTILIDAD =====

// Mostrar indicador de carga
function showLoadingIndicator() {
  const loader = document.getElementById("loadingIndicator");
  if (loader) {
    loader.style.display = "flex";
  }
}

// Ocultar indicador de carga
function hideLoadingIndicator() {
  const loader = document.getElementById("loadingIndicator");
  if (loader) {
    loader.style.display = "none";
  }
}

// Mostrar mensaje de error
function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    showConfirmButton: true,
  });
}

// ===== INICIALIZACIÓN =====

document.addEventListener("DOMContentLoaded", () => {
  // Configurar el dropdown del usuario
  setupUserDropdown();
  
  // Cargar datos del perfil
  loadProfile();
  
  // Configurar el menú lateral (si existe)
  const menuBtn = document.querySelector(".btn-menu");
  const sidebar = document.querySelector(".sidebar");
  
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }
});

// Exponer funciones globales
window.logout = logout;