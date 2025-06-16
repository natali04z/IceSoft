const API_URL = "https://backend-delta-sable.vercel.app/api/permissions";
  
// Variables globales para permisos y paginación
let allPermissions = [];
let originalPermissions = [];
let currentPage = 1;
const rowsPerPage = 10;

// ===== FUNCIONES DE VALIDACIÓN =====

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

// Limpiar mensajes de error
function clearValidationErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
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
  const permissionForm = document.getElementById("permissionForm");
  if (permissionForm) {
    permissionForm.setAttribute("novalidate", "");
    
    const inputs = permissionForm.querySelectorAll("input, select, textarea");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
  
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.setAttribute("novalidate", "");
    
    const inputs = editForm.querySelectorAll("input, select, textarea");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
}

// ===== FUNCIONES DE UTILIDAD =====

// Obtener permisos de usuario
function getUserPermissions() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return ['edit_permissions', 'delete_permissions'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['edit_permissions', 'delete_permissions'];
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return ['edit_permissions', 'delete_permissions'];
  }
}

// Abrir modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error(`Modal con ID "${modalId}" no encontrado`);
    return;
  }
  
  modal.style.display = "flex";
  
  if (modalId === 'registerModal') {
    clearValidationErrors('permissionForm');
    
    const permissionForm = document.getElementById("permissionForm");
    if (permissionForm) {
      permissionForm.reset();
    }
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
  }
}

// Cerrar modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error(`Modal con ID "${modalId}" no encontrado`);
    return;
  }
  
  modal.style.display = "none";
}

function hideLoadingIndicator() {
  Swal.close();
}

const checkAuth = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire({
      icon: 'error',
      title: 'No autorizado',
      text: 'Debe iniciar sesión para acceder a esta página',
      confirmButtonText: 'Ir a login'
    }).then(() => {
      window.location.href = 'index.html';
    });
    return false;
  }
  return true;
};

// Mostrar formulario de registro
const showRegisterForm = () => {
  hideForms();
  const registerFormSection = document.getElementById("registerFormSection");
  const formTitle = document.getElementById("formTitle");
  
  if (registerFormSection) {
    registerFormSection.style.display = "block";
  } else {
    console.error("Elemento registerFormSection no encontrado");
  }
  
  if (formTitle) {
    formTitle.textContent = "Registrar Permiso";
  }
  
  window.scrollTo(0, document.body.scrollHeight);
};

// Ocultar formulario de registro
const hideRegisterForm = () => {
  const registerFormSection = document.getElementById("registerFormSection");
  const permissionForm = document.getElementById("permissionForm");
  
  if (registerFormSection) {
    registerFormSection.style.display = "none";
  }
  
  if (permissionForm) {
    permissionForm.reset();
    clearValidationErrors('permissionForm');
  }
};

// Ocultar formularios
const hideForms = () => {
  const registerFormSection = document.getElementById("registerFormSection");
  const editFormSection = document.getElementById("editFormSection");
  
  if (registerFormSection) {
    registerFormSection.style.display = "none";
  }
  
  if (editFormSection) {
    editFormSection.style.display = "none";
  }
};

// ===== FUNCIONES DE RENDERIZADO (Estructura mejorada) =====

// Renderizar tabla de permisos con la estructura mejorada
const renderPermissionsTable = (page = 1) => {
  const tbody = document.getElementById("permissionTableBody");
  
  if (!tbody) {
    console.error("Elemento permissionTableBody no encontrado en el DOM");
    return;
  }
  
  tbody.innerHTML = "";

  if (!allPermissions || allPermissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          No hay permisos disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const permissionsToShow = allPermissions.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditPermissions = userPermissions.includes("edit_permissions");
  
  let tableContent = '';

  permissionsToShow.forEach((permission, index) => {
    try {
      const permissionId = permission._id || "";
      const displayId = permission.id || permissionId || `Pe${String(index + 1).padStart(2, '0')}`;
      const status = permission.status || "active";
      
      tableContent += `
        <tr data-permissionid="${permissionId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${permission.name || ''}</td>
          <td>${permission.description || '-'}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                ${canEditPermissions ? `onchange="updatePermissionStatus('${permissionId}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${permissionId}')" class="icon-button edit-button" title="Editar" ${canEditPermissions ? '' : 'disabled'}>
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deletePermission('${permissionId}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_permissions") ? '' : 'disabled'}>
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="5" class="text-center text-danger">
            Error al renderizar este permiso: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  renderPaginationControls();
};

// Renderizar controles de paginación con la estructura mejorada
const renderPaginationControls = () => {
  if (!allPermissions || allPermissions.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allPermissions.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info");
  
  if (!container) {
    console.error("Elementos de paginación no encontrados en el DOM");
    return;
  }

  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-nav");
  prevBtn.innerText = "←";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => changePage(currentPage - 1);
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    if (i === currentPage) btn.classList.add("active");
    btn.innerText = i;
    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-nav");
  nextBtn.innerText = "→";
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);

  if (info) {
    const startItem = allPermissions.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allPermissions.length);
    info.innerHTML = `${startItem}-${endItem} de ${allPermissions.length}`;
  }
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderPermissionsTable(currentPage);
};

// ===== FUNCIONES DE CARGA DE DATOS =====

// Cargar permisos sin indicador de carga
const loadPermissionsInternal = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      let permissions = [];
      
      if (data && typeof data === 'object' && data.permissions) {
        permissions = data.permissions;
      } else if (Array.isArray(data)) {
        permissions = data;
      } else if (data && typeof data === 'object') {
        const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayProps.length > 0) {
          permissions = data[arrayProps[0]];
        }
      }
      
      if (!Array.isArray(permissions)) {
        permissions = [];
      }
      
      originalPermissions = permissions;
      allPermissions = [...originalPermissions];
      currentPage = 1;
      
      renderPermissionsTable(currentPage);
      
      const tbody = document.getElementById("permissionTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">
              No se encontraron permisos. Puede que necesite agregar un nuevo permiso o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "No se pudo listar los permisos.");
    }
  } catch (err) {
    showError("Error al listar los permisos");
  }
};

// Listar permisos con indicador de carga (solo para carga inicial)
const listPermissions = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
 
    showLoadingIndicator();
    
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();

    hideLoadingIndicator();
    
    if (res.ok) {
      let permissions = [];
      
      if (data && typeof data === 'object' && data.permissions) {
        permissions = data.permissions;
      } else if (Array.isArray(data)) {
        permissions = data;
      } else if (data && typeof data === 'object') {
        const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayProps.length > 0) {
          permissions = data[arrayProps[0]];
        }
      }
      
      if (!Array.isArray(permissions)) {
        permissions = [];
      }
      
      originalPermissions = permissions;
      allPermissions = [...originalPermissions];
      currentPage = 1;
      
      renderPermissionsTable(currentPage);
      
      const tbody = document.getElementById("permissionTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">
              No se encontraron permisos. Puede que necesite agregar un nuevo permiso o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "Error al listar permisos.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar los permisos");
  }
};

// ===== FUNCIONES DE OPERACIONES CRUD =====

// Registrar permiso
const registerPermission = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const nameValid = validateField("name", "El nombre es obligatorio.");
  
  if (!nameValid) {
    return;
  }
  
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description") ? document.getElementById("description").value.trim() : "";

  try { 
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description })
    });
    
    const data = await res.json();
    
    if (res.status === 201 || res.ok) {
      showSuccess('El permiso ha sido registrado');
      closeModal('registerModal');
      
      const permissionForm = document.getElementById("permissionForm");
      if (permissionForm) {
        permissionForm.reset();
        clearValidationErrors('permissionForm');
      }
      
      loadPermissionsInternal();
    } else {
      showError(data.message || "No se pudo registrar el permiso.");
    }
  } catch (err) {
    showError("Error al registrar el permiso");
  }
};

// Llenar formulario de edición - VERSIÓN CORREGIDA
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  try {
    console.log("Cargando permiso con ID:", id); // Debug
    clearValidationErrors('editForm');
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos del permiso.");
      return;
    }

    const data = await res.json();
    
    // Manejo flexible de la respuesta - puede venir en diferentes formatos
    let permission;
    
    if (data && data.permission) {
      // Si viene dentro de una propiedad 'permission'
      permission = data.permission;
    } else if (data && data.data) {
      // Si viene dentro de una propiedad 'data'
      permission = data.data;
    } else if (data && data._id) {
      // Si la respuesta es directamente el objeto del permiso
      permission = data;
    } else {
      console.error("Formato de respuesta no esperado:", data);
      showError("Error: formato de datos no válido.");
      return;
    }

    // Verificar que tenemos los elementos del DOM
    const editIdElement = document.getElementById("editId");
    const editNameElement = document.getElementById("editName");
    const editDescriptionElement = document.getElementById("editDescription");
    const editStatusElement = document.getElementById("editStatus");
    
    if (!editIdElement || !editNameElement) {
      console.error("Elementos del formulario no encontrados en el DOM");
      showError("Error: elementos del formulario no encontrados.");
      return;
    }
    
    // Llenar los campos del formulario
    if (editIdElement) editIdElement.value = permission._id || permission.id || "";
    if (editNameElement) editNameElement.value = permission.name || "";
    if (editDescriptionElement) editDescriptionElement.value = permission.description || "";
    if (editStatusElement) editStatusElement.value = permission.status || "active";

    openModal('editModal');
  } catch (err) {
    console.error("Error en fillEditForm:", err);
    showError("Error al cargar el permiso.");
  }
};

// Actualizar permiso
const updatePermission = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const nameValid = validateField("editName", "El nombre es obligatorio.");
  
  if (!nameValid) {
    return;
  }

  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const description = document.getElementById("editDescription") ? document.getElementById("editDescription").value.trim() : "";

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description })
    });

    const data = await res.json();
 
    if (res.ok) {
      showSuccess('El permiso ha sido actualizado');
      closeModal('editModal');
      
      const editForm = document.getElementById("editForm");
      if (editForm) {
        editForm.reset();
        clearValidationErrors('editForm');
      }
      
      loadPermissionsInternal();
    } else {
      showError(data.message || "No se pudo actualizar el permiso.");
    }
  } catch (err) {
    showError("Error al actualizar el permiso");
  }
};

// Actualizar estado de permiso
const updatePermissionStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const switchElement = document.querySelector(`tr[data-permissionid="${id}"] input[type="checkbox"]`);
  
  try {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      console.error("Error al parsear JSON:", jsonError);
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      showSuccess(`El permiso ha sido ${status === 'active' ? 'activado' : 'desactivado'}`);
      
      if (switchElement) {
        switchElement.checked = status === 'active';
      }
      
      // Actualizar el estado en los arrays de permisos
      const permissionIndex = allPermissions.findIndex(p => p._id === id);
      if (permissionIndex !== -1) {
        allPermissions[permissionIndex].status = status;
      }
      
      const originalIndex = originalPermissions.findIndex(p => p._id === id);
      if (originalIndex !== -1) {
        originalPermissions[originalIndex].status = status;
      }
      
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} el permiso (${res.status})`;
      showError(errorMsg);

      if (switchElement) {
        switchElement.checked = status !== 'active';
      }
    }
  } catch (err) {
    showError("Error al actualizar estado del permiso");
    
    if (switchElement) {
      switchElement.checked = status !== 'active';
    }
  }
};

// Eliminar permiso
const deletePermission = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const confirmed = await showConfirm({ 
    title: "¿Estás seguro de eliminar este permiso?", 
    text: "Esta acción no se puede deshacer.", 
    confirmText: "Eliminar", 
    cancelText: "Cancelar" 
  });

  if (!confirmed) return;
  
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      showSuccess('El permiso ha sido eliminado');
      loadPermissionsInternal();
    } else {
      const data = await res.json();
      showError(data.message || "No se pudo eliminar el permiso");
    }
  } catch (err) {
    showError("Error al eliminar el permiso");
  }
};

// Buscar permiso
const searchPermission = () => {
  const searchInput = document.getElementById("searchInput");
  
  if (!searchInput) {
    console.error("Elemento searchInput no encontrado");
    return;
  }
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalPermissions) {
    console.error("Array originalPermissions no inicializado");
    return;
  }
  
  if (!term) {
    allPermissions = [...originalPermissions];
  } else {
    allPermissions = originalPermissions.filter(p => {
      const nameMatch = p.name && p.name.toLowerCase().includes(term);
      const descriptionMatch = p.description && p.description.toLowerCase().includes(term);
      const idMatch = (p.id || p._id) && (p.id || p._id).toLowerCase().includes(term);
      
      return nameMatch || descriptionMatch || idMatch;
    });
  }
  
  currentPage = 1;
  renderPermissionsTable(currentPage);
};

// ===== FUNCIONES DE UTILIDAD ADICIONALES =====

// Función para mostrar alertas
function showAlert(message, type) {
  let alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.id = "alertContainer";
    alertContainer.className = "alert-container";
    document.body.appendChild(alertContainer);
  }
  
  const alertElement = document.createElement("div");
  alertElement.className = `alert alert-${type}`;
  alertElement.textContent = message;
  
  const closeButton = document.createElement("span");
  closeButton.className = "alert-close";
  closeButton.innerHTML = "&times;";
  closeButton.onclick = function() {
    alertContainer.removeChild(alertElement);
  };
  
  alertElement.appendChild(closeButton);
  alertContainer.appendChild(alertElement);
  
  setTimeout(() => {
    if (alertElement.parentNode === alertContainer) {
      alertContainer.removeChild(alertElement);
    }
  }, 5000);
}

// Función para mostrar error
function showError(message, type = "error") {
  showAlert(message, type);
}

// ===== FUNCIONES DE INICIALIZACIÓN =====

function initializeValidationEvents() {
  disableNativeBrowserValidation();
  
  // Validación en tiempo real - Formulario de registro
  const nameField = document.getElementById("name");
  if (nameField) {
    nameField.addEventListener("blur", () => validateField("name", "El nombre es obligatorio."));
  }
  
  // Validación en tiempo real - Formulario de edición
  const editNameField = document.getElementById("editName");
  if (editNameField) {
    editNameField.addEventListener("blur", () => validateField("editName", "El nombre es obligatorio."));
  }

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updatePermission();
    };
  }
  
  const permissionForm = document.getElementById("permissionForm");
  if (permissionForm) {
    permissionForm.onsubmit = async (event) => {
      event.preventDefault();
      await registerPermission();
    };
  }
}

function initializeListPage() {
  const permissionTableBody = document.getElementById("permissionTableBody");
  if (!permissionTableBody) {
    console.error("ELEMENTO CRÍTICO NO ENCONTRADO: permissionTableBody");
    return;
  }
 
  try {
    listPermissions();
  } catch (err) {
    console.error("Error durante la inicialización:", err);
    showError("Error al inicializar la página");
  }
  
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
  } else {
    console.warn("Elemento mobileAddButton no encontrado");
  }
  
  const addUserButton = document.getElementById("addUserButton");
  if (addUserButton) {
    addUserButton.onclick = () => openModal('registerModal');
  }
  
  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.onclick = registerPermission;
  } else {
    console.warn("Elemento registerButton no encontrado");
  }
  
  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.onclick = updatePermission;
  } else {
    console.warn("Elemento updateButton no encontrado");
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchPermission);
  } else {
    console.warn("Elemento searchInput no encontrado");
  }
}

// ===== EVENTOS AL CARGAR EL DOM =====

document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;
  
  initializeValidationEvents();
  initializeListPage();
});

// ===== FUNCIONES GLOBALES =====

window.validateField = validateField;
window.clearValidationErrors = clearValidationErrors;
window.disableNativeBrowserValidation = disableNativeBrowserValidation;
window.fillEditForm = fillEditForm;
window.updatePermissionStatus = updatePermissionStatus;
window.deletePermission = deletePermission;
window.openModal = openModal;
window.closeModal = closeModal;
window.showRegisterForm = showRegisterForm;
window.hideRegisterForm = hideRegisterForm;
window.searchPermission = searchPermission;
window.hideLoadingIndicator = hideLoadingIndicator;