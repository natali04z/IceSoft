const API_URL = "https://backend-yy4o.onrender.com/api/permissions";
  
// Variables globales
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
  // Desactivar validación del formulario de registro
  const permissionForm = document.getElementById("permissionForm");
  if (permissionForm) {
    permissionForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = permissionForm.querySelectorAll("input, select, textarea");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
  
  // Desactivar validación del formulario de edición
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = editForm.querySelectorAll("input, select, textarea");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
}

// ===== FUNCIONES PRINCIPALES =====

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
  if (modal) {
    modal.style.display = "flex";
    
    // Resetear mensajes de error al abrir el modal
    if (modalId === 'registerModal') {
      clearValidationErrors('permissionForm');
      document.getElementById("permissionForm").reset();
    } else if (modalId === 'editModal') {
      clearValidationErrors('editForm');
    }
  } else {
    console.error(`Modal con ID "${modalId}" no encontrado`);
  }
}

// Cerrar modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  } else {
    console.error(`Modal con ID "${modalId}" no encontrado`);
  }
}

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

// Renderizar tabla de permisos
const renderPermissionsTable = (page = 1) => {
  const tbody = document.getElementById("permissionTableBody");
  
  if (!tbody) {
    console.error("Elemento permissionTableBody no encontrado en el DOM");
    return;
  }
  
  tbody.innerHTML = "";

  if (!allPermissions || allPermissions.length === 0) {
    showError("No hay permisos para mostrar");
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">No hay permisos disponibles</td></tr>`;
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const permissionsToShow = allPermissions.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditPermissions = userPermissions.includes("edit_permissions");

  permissionsToShow.forEach(permission => {
    tbody.innerHTML += `
      <tr>
        <td>${permission.id || ''}</td>
        <td>${permission.name || ''}</td>
        <td>${permission.code || ''}</td>
        <td>${permission.description || '-'}</td>
        <td>
          <label class="switch">
            <input type="checkbox" ${permission.status === "active" ? "checked" : ""} 
              ${canEditPermissions ? `onchange="updatePermissionStatus('${permission._id}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
            <span class="slider round"></span>
          </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${permission._id}')" class="icon-button edit-button" title="Editar" ${canEditPermissions ? '' : 'disabled'}>
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deletePermission('${permission._id}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_permissions") ? '' : 'disabled'}>
              <i class="material-icons">delete</i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  renderPaginationControls();
};

// Renderizar controles de paginación
const renderPaginationControls = () => {
  if (!allPermissions || allPermissions.length === 0) {
    console.warn("No hay permisos para paginar");
    return;
  }
  
  const totalPages = Math.ceil(allPermissions.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info:nth-child(2)");
  
  if (!container || !info) {
    console.error("Elementos de paginación no encontrados en el DOM");
    return;
  }

  container.innerHTML = "";

  // Botón anterior
  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-nav");
  prevBtn.innerText = "←";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => changePage(currentPage - 1);
  container.appendChild(prevBtn);

  // Números de página
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    if (i === currentPage) btn.classList.add("active");
    btn.innerText = i;
    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }

  // Botón siguiente
  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-nav");
  nextBtn.innerText = "→";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);

  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(startItem + rowsPerPage - 1, allPermissions.length);
  info.innerHTML = `${startItem}-${endItem} de ${allPermissions.length}`;
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderPermissionsTable(currentPage);
};

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
      originalPermissions = data.permissions || data;
      
      allPermissions = [...originalPermissions];
      currentPage = 1;
      renderPermissionsTable(currentPage);
    } else {
      showError(data.message || "No se pudo listar los permisos.");
    }
  } catch (err) {
    showError("Error al listar los permisos");
  }
};

// Listar permisos con indicador de carga
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
      originalPermissions = data.permissions || data;
      
      allPermissions = [...originalPermissions];
      currentPage = 1;
      renderPermissionsTable(currentPage);
    } else {
      showError(data.message || "Error al listar permisos.", "error");
    }
  } catch (err) {
    hideLoadingIndicator();
    showAlert("Error al listar los permisos");
  }
};

// Registrar permiso
const registerPermission = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showAlert("Inicie sesión nuevamente.");
    return;
  }
  
  // Validar campos"
  const nameValid = validateField("name", "El nombre es obligatorio.");
  const codeValid = validateField("code", "El código es obligatorio.");
  
  // Si algún campo no es válido, detener el proceso
  if (!nameValid || !codeValid) {
    return;
  }
  
  const name = document.getElementById("name").value.trim();
  const code = document.getElementById("code").value.trim();
  const description = document.getElementById("description") ? document.getElementById("description").value.trim() : "";

  try { 
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, code, description })
    });
    
    const data = await res.json();
    
    if (res.status === 201 || res.ok) {
      showSuccess('El permiso ha sido registrado');
      closeModal('registerModal');
      
      const permissionForm = document.getElementById("permissionForm");
      if (permissionForm) {
        permissionForm.reset();
        clearValidationErrors('permissionForm');
      } else {
        showError("Formulario permissionForm no encontrado");
      }
      
      loadPermissionsInternal();
    } else {
      showErrort(data.message || "No se pudo registrar el permiso.");
    }
  } catch (err) {
    showError("Error al registrar el permiso");
  }
};

// Llenar formulario de edición
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  try {
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

    const permission = await res.json();

    clearValidationErrors('editForm');

    const editIdElement = document.getElementById("editId");
    const editNameElement = document.getElementById("editName");
    const editCodeElement = document.getElementById("editCode");
    const editDescriptionElement = document.getElementById("editDescription");
    const editStatusElement = document.getElementById("editStatus");
    
    if (editIdElement) editIdElement.value = permission._id;
    if (editNameElement) editNameElement.value = permission.name || "";
    if (editCodeElement) editCodeElement.value = permission.code || "";
    if (editDescriptionElement) editDescriptionElement.value = permission.description || "";
    if (editStatusElement) editStatusElement.value = permission.status || "active";

    openModal('editModal');
  } catch (err) {
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

  // Validar campos
  const nameValid = validateField("editName", "El nombre es obligatorio.");
  const codeValid = validateField("editCode", "El código es obligatorio.");
  
  // Si algún campo no es válido, detener el proceso
  if (!nameValid || !codeValid) {
    return;
  }

  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const code = document.getElementById("editCode").value.trim();
  const description = document.getElementById("editDescription") ? document.getElementById("editDescription").value.trim() : "";

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, code, description })
    });

    const data = await res.json();
 
    if (res.ok) {
      showSuccess('El permiso ha sido actualizado');
      closeModal('editModal');
      
      const editForm = document.getElementById("editForm");
      if (editForm) {
        editForm.reset();
        clearValidationErrors('editForm');
      } else {
        console.warn("Formulario editForm no encontrado");
      }
      
      loadPermissionsInternal();
    } else {
      showError(data.message ||"No se pudo actualizar el permiso.");
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
      
      loadPermissionsInternal();
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} el permiso (${res.status})`;
      
      showError(errorMsg, "error");

      console.error("Error response:", {
        status: res.status,
        data: data
      });
      loadPermissionsInternal();
    }
  } catch (err) {
    showError("Error al actualizar estado del permiso");
    loadPermissionsInternal();
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
    
    const data = await res.json();
    
    if (res.ok) {
      showSuccess('El permiso ha sido eliminado');
      loadPermissionsInternal();
    } else {
      showAlert(data.message || "No se pudo eliminar el permiso");
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
  
  allPermissions = term
    ? originalPermissions.filter(p => 
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.code && p.code.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
      )
    : [...originalPermissions];
  
  currentPage = 1;
  renderPermissionsTable(currentPage);
};

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  // Desactivar validación nativa del navegador
  disableNativeBrowserValidation();
  
  const permissionTableBody = document.getElementById("permissionTableBody");
  if (!permissionTableBody) {
    console.error("ELEMENTO CRÍTICO NO ENCONTRADO: permissionTableBody");
  }
 
  try {
    listPermissions(); // Esta es la única que usa el indicador de carga
  } catch (err) {
    console.error("Error durante la inicialización:", err);
  }
  
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
  } else {
    console.warn("Elemento mobileAddButton no encontrado");
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

  // Agregar validación para campos individuales en tiempo real - Formulario de registro
  document.getElementById("name").addEventListener("blur", () => validateField("name", "El nombre es obligatorio."));
  document.getElementById("code").addEventListener("blur", () => validateField("code", "El código es obligatorio."));
  
  // Agregar validación para campos individuales en tiempo real - Formulario de edición
  document.getElementById("editName").addEventListener("blur", () => validateField("editName", "El nombre es obligatorio."));
  document.getElementById("editCode").addEventListener("blur", () => validateField("editCode", "El código es obligatorio."));

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
});


// Función para mostrar alertas
function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) {
    console.error("Contenedor de alertas no encontrado");
    alert(message); // Fallback a alert nativo
    return;
  }
  
  const alertElement = document.createElement("div");
  alertElement.className = `alert alert-${type}`;
  alertElement.textContent = message;
  
  // Agregar botón de cerrar
  const closeButton = document.createElement("span");
  closeButton.className = "alert-close";
  closeButton.innerHTML = "&times;";
  closeButton.onclick = function() {
    alertContainer.removeChild(alertElement);
  };
  
  alertElement.appendChild(closeButton);
  alertContainer.appendChild(alertElement);
  
  // Auto eliminar después de 5 segundos
  setTimeout(() => {
    if (alertElement.parentNode === alertContainer) {
      alertContainer.removeChild(alertElement);
    }
  }, 5000);
}

// Exportar funciones globales
window.fillEditForm = fillEditForm;
window.updatePermissionStatus = updatePermissionStatus;
window.deletePermission = deletePermission;
window.openModal = openModal;
window.closeModal = closeModal;
window.showRegisterForm = showRegisterForm;
window.hideRegisterForm = hideRegisterForm;