const API_URL = "https://backend-yy4o.onrender.com/api/roles";
  
// Variables globales para roles y paginación
let allRoles = [];
let originalRoles = [];
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

// Validar permisos seleccionados
function validatePermissions(formId) {
  const form = document.getElementById(formId);
  const permissionsName = formId === 'roleForm' ? 'permissions' : 'editPermissions';
  const errorId = formId === 'roleForm' ? 'permissions-error' : 'editPermissions-error';
  
  const selectedPermissions = form.querySelectorAll(`input[name="${permissionsName}"]:checked`);
  const errorElement = document.getElementById(errorId);
  
  if (selectedPermissions.length === 0) {
    errorElement.style.display = "block";
    return false;
  } else {
    errorElement.style.display = "none";
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
  const roleForm = document.getElementById("roleForm");
  if (roleForm) {
    roleForm.setAttribute("novalidate", "");
    
    const inputs = roleForm.querySelectorAll("input, select, textarea");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
  
  const editRoleForm = document.getElementById("editRoleForm");
  if (editRoleForm) {
    editRoleForm.setAttribute("novalidate", "");
    
    const inputs = editRoleForm.querySelectorAll("input, select, textarea");
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
    if (!userInfo) return ['edit_roles', 'delete_roles'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['edit_roles', 'delete_roles'];
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return ['edit_roles', 'delete_roles'];
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
  
  if (modalId === 'roleModal') {
    clearValidationErrors('roleForm');
    
    const roleForm = document.getElementById("roleForm");
    if (roleForm) {
      roleForm.reset();
    }
  } else if (modalId === 'editRoleModal') {
    clearValidationErrors('editRoleForm');
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

// ===== FUNCIONES DE FORMATEO =====

// Formatear los permisos para mostrarlos en la tabla
function formatPermissions(permissions, roleId) {
  if (!permissions || permissions.length === 0) return '-';
  
  return `<button class="view-details-btn" onclick="showPermissionsDetails('${roleId}')">
            <i class="material-icons">visibility</i> 
            Ver ${permissions.length} permisos
          </button>`;
}

// Mostrar modal con detalles de permisos
function showPermissionsDetails(roleId) {
  try {
    const role = allRoles.find(r => r._id === roleId);
    if (!role || !role.permissions) {
      showError("No se encontraron permisos para este rol");
      return;
    }
    
    let permissionsHTML = '';
    let permissionCount = 0;
    
    if (role.permissions.length > 0 && typeof role.permissions[0] === 'object') {
      const groupedPermissions = {};
      
      role.permissions.forEach(perm => {
        const category = perm.code ? perm.code.split('_')[0] : 'otros';
        if (!groupedPermissions[category]) {
          groupedPermissions[category] = [];
        }
        groupedPermissions[category].push(perm);
        permissionCount++;
      });
      
      for (const category in groupedPermissions) {
        const perms = groupedPermissions[category];
        permissionsHTML += `
          <div class="permission-category">
            <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <ul class="permission-list">
              ${perms.map(p => `<li>${p.name} (${p.code})</li>`).join('')}
            </ul>
          </div>
        `;
      }
    } else {
      permissionsHTML = `
        <div class="permission-category">
          <h4>Permisos</h4>
          <p>${role.permissions.length} permisos asignados</p>
        </div>
      `;
      permissionCount = role.permissions.length;
    }
    
    Swal.fire({
      title: `Permisos de ${role.name}`,
      html: `
        <div class="permissions-details-container">
          <p class="permissions-count">Total: ${permissionCount} permisos</p>
          <div class="permissions-grid">
            ${permissionsHTML}
          </div>
        </div>
      `,
      width: '600px',
      showCloseButton: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        container: 'permissions-modal-container',
        popup: 'permissions-modal-popup',
        content: 'permissions-modal-content',
        closeButton: 'permissions-modal-close'
      }
    });
    
    const styleId = 'permissions-details-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .permissions-modal-popup {
          max-width: 90vw;
          padding-top: 15px;
        }
        
        .permissions-modal-close {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 20px;
          color: #666;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        
        .permissions-modal-close:hover {
          opacity: 1;
          color: #333;
        }
        
        .permissions-details-container {
          text-align: left;
          padding: 5px 0;
        }
        
        .permissions-count {
          margin-bottom: 15px;
          font-weight: bold;
          color: #333;
        }
        
        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 5px;
        }
        
        .permission-category {
          background: #f7f9fc;
          border-radius: 6px;
          padding: 8px 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .permission-category h4 {
          margin-top: 0;
          margin-bottom: 8px;
          color: #333;
          border-bottom: 1px solid #e0e4e9;
          padding-bottom: 5px;
          font-size: 14px;
        }
        
        .permission-list {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 13px;
        }
        
        .permission-list li {
          padding: 3px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .permission-list li:last-child {
          border-bottom: none;
        }
        
        @media (max-width: 768px) {
          .permissions-grid {
            grid-template-columns: 1fr;
          }
        }
      `;
      document.head.appendChild(style);
    }
  } catch (err) {
    console.error("Error al mostrar detalles de permisos:", err);
    showError("Error al cargar los detalles de permisos");
  }
}

// ===== FUNCIONES DE RENDERIZADO (Estructura mejorada) =====

// Renderizar tabla de roles con la estructura mejorada
const renderRolesTable = (page = 1) => {
  const tbody = document.getElementById("roleTableBody");
  
  if (!tbody) {
    console.error("Elemento roleTableBody no encontrado en el DOM");
    return;
  }
  
  tbody.innerHTML = "";

  if (!allRoles || allRoles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          No hay roles disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const rolesToShow = allRoles.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditRoles = userPermissions.includes("edit_roles");
  
  let tableContent = '';

  rolesToShow.forEach((role, index) => {
    try {
      const roleId = role._id || "";
      const displayId = role.id || roleId || `Ro${String(index + 1).padStart(2, '0')}`;
      const status = role.status || "active";
      
      tableContent += `
        <tr data-roleid="${roleId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${role.name || ''}</td>
          <td>${role.description || '-'}</td>
          <td>${formatPermissions(role.permissions, roleId)}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                ${canEditRoles && role.name !== "admin" ? `onchange="updateRoleStatus('${roleId}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${roleId}')" class="icon-button edit-button" title="Editar" ${canEditRoles && role.name !== "admin" ? '' : 'disabled'}>
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deleteRole('${roleId}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_roles") && !role.isDefault ? '' : 'disabled'}>
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="6" class="text-center text-danger">
            Error al renderizar este rol: ${error.message}
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
  if (!allRoles || allRoles.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allRoles.length / rowsPerPage);
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
    const startItem = allRoles.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allRoles.length);
    info.innerHTML = `${startItem}-${endItem} de ${allRoles.length}`;
  }
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderRolesTable(currentPage);
};

// ===== FUNCIONES DE CARGA DE DATOS =====

// Cargar roles sin indicador de carga
const loadRolesInternal = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
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
      let roles = [];
      
      if (data && typeof data === 'object' && data.roles) {
        roles = data.roles;
      } else if (Array.isArray(data)) {
        roles = data;
      } else if (data && typeof data === 'object') {
        const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayProps.length > 0) {
          roles = data[arrayProps[0]];
        }
      }
      
      if (!Array.isArray(roles)) {
        roles = [];
      }
      
      originalRoles = roles;
      allRoles = [...originalRoles];
      currentPage = 1;
      
      renderRolesTable(currentPage);
      
      const tbody = document.getElementById("roleTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center">
              No se encontraron roles. Puede que necesite agregar un nuevo rol o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "Error al listar roles.");
    }
  } catch (err) {
    console.error("Error al listar roles:", err);
    showError("Error al listar roles: " + (err.message || err));
  }
};

// Listar roles con indicador de carga (solo para carga inicial)
const listRoles = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
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
      let roles = [];
      
      if (data && typeof data === 'object' && data.roles) {
        roles = data.roles;
      } else if (Array.isArray(data)) {
        roles = data;
      } else if (data && typeof data === 'object') {
        const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayProps.length > 0) {
          roles = data[arrayProps[0]];
        }
      }
      
      if (!Array.isArray(roles)) {
        roles = [];
      }
      
      originalRoles = roles;
      allRoles = [...originalRoles];
      currentPage = 1;
      
      renderRolesTable(currentPage);
      
      const tbody = document.getElementById("roleTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center">
              No se encontraron roles. Puede que necesite agregar un nuevo rol o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "Error al listar roles.");
    }
  } catch (err) {
    hideLoadingIndicator();
    console.error("Error al listar roles:", err);
    showError("Error al listar roles: " + (err.message || err));
  }
};

// Cargar permisos para el formulario
const loadPermissionsForForm = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch("https://backend-yy4o.onrender.com/api/permissions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      const permissions = data.permissions || data;
      console.log("Permisos cargados:", permissions);
      
      const permissionsContainer = document.getElementById("permissionsContainer");
      const editPermissionsContainer = document.getElementById("editPermissionsContainer");
      
      const groupedPermissions = {};
      
      permissions.forEach(permission => {
        if (permission.status !== "active") return;
        
        const category = permission.code ? permission.code.split('_')[0] : 
                        (permission.name ? permission.name.split(' ')[0].toLowerCase() : 'otros');
        
        if (!groupedPermissions[category]) {
          groupedPermissions[category] = [];
        }
        groupedPermissions[category].push(permission);
      });
      
      // Renderizar los permisos agrupados en el formulario de creación
      if (permissionsContainer) {
        permissionsContainer.innerHTML = "";
        
        for (const category in groupedPermissions) {
          const perms = groupedPermissions[category];
          const categoryId = `category-${category}`;
          
          const isFirstCategory = Object.keys(groupedPermissions)[0] === category;
          
          permissionsContainer.innerHTML += `
            <div class="permission-section">
              <div class="permission-category-header" onclick="togglePermissionCategory('${categoryId}')">
                <h5>${category.charAt(0).toUpperCase() + category.slice(1)} <span>(${perms.length})</span></h5>
                <i class="material-icons category-toggle">${isFirstCategory ? 'expand_more' : 'expand_less'}</i>
              </div>
              <div id="${categoryId}" class="permission-items" style="${isFirstCategory ? '' : 'display: none;'}">
                ${perms.map(permission => `
                  <div class="checkbox-container">
                    <input type="checkbox" id="perm-${permission._id}" value="${permission._id}" name="permissions">
                    <label for="perm-${permission._id}" title="${permission.name} (${permission.code})">${permission.name}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
        
        permissionsContainer.innerHTML = `
          <div class="permissions-actions">
            <button type="button" class="text-button" onclick="selectAllPermissions('permissions')">Seleccionar todos</button>
            <button type="button" class="text-button" onclick="deselectAllPermissions('permissions')">Ninguno</button>
          </div>
        ` + permissionsContainer.innerHTML;
      }
      
      // Renderizar los permisos agrupados en el formulario de edición
      if (editPermissionsContainer) {
        editPermissionsContainer.innerHTML = "";
        
        for (const category in groupedPermissions) {
          const perms = groupedPermissions[category];
          const categoryId = `edit-category-${category}`;
          
          const isFirstCategory = Object.keys(groupedPermissions)[0] === category;
          
          editPermissionsContainer.innerHTML += `
            <div class="permission-section">
              <div class="permission-category-header" onclick="togglePermissionCategory('${categoryId}')">
                <h5>${category.charAt(0).toUpperCase() + category.slice(1)} <span>(${perms.length})</span></h5>
                <i class="material-icons category-toggle">${isFirstCategory ? 'expand_more' : 'expand_less'}</i>
              </div>
              <div id="${categoryId}" class="permission-items" style="${isFirstCategory ? '' : 'display: none;'}">
                ${perms.map(permission => `
                  <div class="checkbox-container">
                    <input type="checkbox" id="edit-${permission._id}" value="${permission._id}" name="editPermissions">
                    <label for="edit-${permission._id}" title="${permission.name} (${permission.code})">${permission.name}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
        
        editPermissionsContainer.innerHTML = `
          <div class="permissions-actions">
            <button type="button" class="text-button" onclick="selectAllPermissions('editPermissions')">Seleccionar todos</button>
            <button type="button" class="text-button" onclick="deselectAllPermissions('editPermissions')">Ninguno</button>
          </div>
        ` + editPermissionsContainer.innerHTML;
      }
      
      // Inyectar estilos CSS para las secciones de permisos
      const styleId = 'permission-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .permissions-container {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #e0e4e9;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 10px;
          }
          
          .permission-section {
            margin-bottom: 6px;
            border: 1px solid #e8eaed;
            border-radius: 6px;
            overflow: hidden;
          }
          
          .permission-category-header {
            padding: 8px 12px;
            background-color: #f7f9fc;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .permission-category-header h5 {
            margin: 0;
            font-size: 14px;
            color: #333;
          }
          
          .permission-category-header h5 span {
            color: #6c757d;
            font-size: 12px;
            font-weight: normal;
          }
          
          .permission-items {
            padding: 8px 12px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 5px;
            background: #fff;
            max-height: 180px;
            overflow-y: auto;
          }
          
          .checkbox-container {
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .checkbox-container label {
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            max-width: calc(100% - 25px);
            vertical-align: middle;
          }
          
          .permissions-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-bottom: 6px;
          }
          
          .text-button {
            background: none;
            border: none;
            color: #2962ff;
            cursor: pointer;
            font-size: 12px;
            text-decoration: underline;
            padding: 3px;
          }
          
          .text-button:hover {
            color: #0039cb;
          }
          
          .view-details-btn {
            background: none;
            border: none;
            color: #2962ff;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 13px;
            padding: 3px 5px;
            border-radius: 4px;
          }
          
          .view-details-btn:hover {
            background-color: rgba(41, 98, 255, 0.1);
          }
          
          .view-details-btn i {
            font-size: 16px;
          }
          
          .modal-content {
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
          }
          
          .form-field {
            margin-bottom: 12px;
          }
          
          .form-row {
            margin-bottom: 10px;
          }
          
          input[type="checkbox"] {
            margin-right: 5px;
            vertical-align: middle;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      showError(data.message || "Error al cargar permisos.");
    }
  } catch (err) {
    console.error("Error al cargar permisos:", err);
    showError("Error al cargar permisos: " + (err.message || err));
  }
};

// ===== FUNCIONES AUXILIARES PARA PERMISOS =====

// Función para alternar la visibilidad de una categoría de permisos
function togglePermissionCategory(categoryId) {
  const category = document.getElementById(categoryId);
  const header = category.previousElementSibling;
  const icon = header.querySelector('.category-toggle');
  
  if (category.style.display === 'none') {
    category.style.display = 'grid';
    icon.textContent = 'expand_more';
  } else {
    category.style.display = 'none';
    icon.textContent = 'expand_less';
  }
}

// Función para seleccionar todos los permisos
function selectAllPermissions(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
}

// Función para deseleccionar todos los permisos
function deselectAllPermissions(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
}

// Función específica para marcar los permisos en el formulario
function marcarPermisosEnFormulario(permisos) {
  if (!permisos || !Array.isArray(permisos) || permisos.length === 0) {
    console.warn("No hay permisos para marcar o formato incorrecto");
    return;
  }
  
  console.log("Iniciando marcado de permisos. Total permisos a marcar:", permisos.length);
  
  const allCheckboxes = document.querySelectorAll('input[name="editPermissions"]');
  allCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  console.log("Total checkboxes encontrados:", allCheckboxes.length);
  
  const permisosIds = new Set();
  permisos.forEach(perm => {
    if (typeof perm === 'object' && perm !== null && perm._id) {
      permisosIds.add(perm._id);
      console.log(`Permiso a marcar (objeto): ${perm._id}`);
    } else if (typeof perm === 'string') {
      permisosIds.add(perm);
      console.log(`Permiso a marcar (string): ${perm}`);
    }
  });
  
  console.log("IDs de permisos a marcar:", Array.from(permisosIds));
  
  let permisosEncontrados = 0;
  allCheckboxes.forEach(checkbox => {
    const permissionId = checkbox.value;
    console.log(`Verificando checkbox: id=${checkbox.id}, value=${permissionId}`);
    
    if (permisosIds.has(permissionId)) {
      checkbox.checked = true;
      permisosEncontrados++;
      console.log(`✓ Checkbox marcado: ${checkbox.id} (${permissionId})`);
      
      const categoryItem = checkbox.closest('.permission-items');
      if (categoryItem && categoryItem.style.display === 'none') {
        categoryItem.style.display = 'grid';
        const header = categoryItem.previousElementSibling;
        if (header) {
          const icon = header.querySelector('.category-toggle');
          if (icon) icon.textContent = 'expand_more';
        }
      }
    }
  });
  
  console.log(`Permisos marcados: ${permisosEncontrados} de ${permisosIds.size} esperados`);
}

// ===== FUNCIONES DE OPERACIONES CRUD =====

// Registrar rol
const registerRole = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const nameValid = validateField("name", "El nombre es obligatorio.");
  const permissionsValid = validatePermissions("roleForm");
  
  if (!nameValid || !permissionsValid) {
    return;
  }
  
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description") ? document.getElementById("description").value.trim() : "";
  
  const selectedPermissions = [];
  const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]:checked');
  permissionCheckboxes.forEach(checkbox => {
    selectedPermissions.push(checkbox.value);
  });

  try { 
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, permissions: selectedPermissions })
    });
    
    const data = await res.json();
    
    if (res.status === 201 || res.ok) {
      showSuccess('Rol registrado correctamente.');
      closeModal('roleModal');
      
      const roleForm = document.getElementById("roleForm");
      if (roleForm) {
        roleForm.reset();
        clearValidationErrors('roleForm');
      }
      
      loadRolesInternal();
    } else {
      showError(data.message || "Error al registrar rol.");
    }
  } catch (err) {
    console.error("Error al registrar rol:", err);
    showError("Error al registrar rol: " + (err.message || err));
  }
};

// Llenar formulario de edición
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  try {
    clearValidationErrors('editRoleForm');
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos del rol.");
      return;
    }

    const role = await res.json();

    const editIdElement = document.getElementById("editId");
    const editNameElement = document.getElementById("editName");
    const editDescriptionElement = document.getElementById("editDescription");
    
    if (editIdElement) editIdElement.value = role._id;
    if (editNameElement) editNameElement.value = role.name || "";
    if (editDescriptionElement) editDescriptionElement.value = role.description || "";
    
    openModal('editRoleModal');
    
    setTimeout(() => {
      marcarPermisosEnFormulario(role.permissions);
    }, 300);
    
  } catch (err) {
    console.error("Error al cargar el rol:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar rol
const updateRole = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const nameValid = validateField("editName", "El nombre es obligatorio.");
  const permissionsValid = validatePermissions("editRoleForm");
  
  if (!nameValid || !permissionsValid) {
    return;
  }

  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const description = document.getElementById("editDescription") ? document.getElementById("editDescription").value.trim() : "";
  
  const selectedPermissions = [];
  const permissionCheckboxes = document.querySelectorAll('input[name="editPermissions"]:checked');
  permissionCheckboxes.forEach(checkbox => {
    selectedPermissions.push(checkbox.value);
  });

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, permissions: selectedPermissions })
    });

    const data = await res.json();
 
    if (res.ok) {
      showSuccess('Rol actualizado correctamente.');
      closeModal('editRoleModal');
      
      const editRoleForm = document.getElementById("editRoleForm");
      if (editRoleForm) {
        editRoleForm.reset();
        clearValidationErrors('editRoleForm');
      }
      
      loadRolesInternal();
    } else {
      showError(data.message || "Error al actualizar el rol.");
    }
  } catch (err) {
    console.error("Error al actualizar rol:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar estado de rol
const updateRoleStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const switchElement = document.querySelector(`tr[data-roleid="${id}"] input[type="checkbox"]`);
  
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
      showSuccess(`Rol ${status === 'active' ? 'activado' : 'desactivado'} correctamente.`);
      
      if (switchElement) {
        switchElement.checked = status === 'active';
      }
      
      const roleIndex = allRoles.findIndex(r => r._id === id);
      if (roleIndex !== -1) {
        allRoles[roleIndex].status = status;
      }
      
      const originalIndex = originalRoles.findIndex(r => r._id === id);
      if (originalIndex !== -1) {
        originalRoles[originalIndex].status = status;
      }
      
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} el rol (${res.status})`;
      showError(errorMsg);

      if (switchElement) {
        switchElement.checked = status !== 'active';
      }
    }
  } catch (err) {
    console.error("Error al actualizar estado:", err);
    showError(`Ocurrió un error de red: ${err.message || err}`);
    
    if (switchElement) {
      switchElement.checked = status !== 'active';
    }
  }
};

// Eliminar rol
const deleteRole = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const confirmed = await showConfirm({ 
    title: "¿Estás seguro de eliminar este rol?", 
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
      showSuccess('Rol eliminado correctamente.');
      loadRolesInternal();
    } else {
      const data = await res.json();
      showError(data.message || "No se pudo eliminar el rol");
    }
  } catch (err) {
    console.error("Error al eliminar rol:", err);
    showError("Error al eliminar rol: " + (err.message || err));
  }
};

// Buscar rol
const searchRole = () => {
  const searchInput = document.getElementById("searchInput");
  
  if (!searchInput) {
    console.error("Elemento searchInput no encontrado");
    return;
  }
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalRoles) {
    console.error("Array originalRoles no inicializado");
    return;
  }
  
  if (!term) {
    allRoles = [...originalRoles];
  } else {
    allRoles = originalRoles.filter(r => {
      const nameMatch = r.name && r.name.toLowerCase().includes(term);
      const idMatch = (r.id || r._id) && (r.id || r._id).toLowerCase().includes(term);
      const descriptionMatch = r.description && r.description.toLowerCase().includes(term);
      
      return nameMatch || idMatch || descriptionMatch;
    });
  }
  
  currentPage = 1;
  renderRolesTable(currentPage);
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

  const editRoleForm = document.getElementById("editRoleForm");
  if (editRoleForm) {
    editRoleForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateRole();
    };
  }
  
  const roleForm = document.getElementById("roleForm");
  if (roleForm) {
    roleForm.onsubmit = async (event) => {
      event.preventDefault();
      await registerRole();
    };
  }
}

function initializeListPage() {
  const roleTableBody = document.getElementById("roleTableBody");
  if (!roleTableBody) {
    console.error("ELEMENTO CRÍTICO NO ENCONTRADO: roleTableBody");
    return;
  }
 
  try {
    listRoles();
    loadPermissionsForForm();
  } catch (err) {
    console.error("Error durante la inicialización:", err);
    showError("Error al inicializar la página");
  }
  
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('roleModal');
  } else {
    console.warn("Elemento mobileAddButton no encontrado");
  }
  
  const addUserButton = document.getElementById("addUserButton");
  if (addUserButton) {
    addUserButton.onclick = () => openModal('roleModal');
  }
  
  const createRoleButton = document.getElementById("createRoleButton");
  if (createRoleButton) {
    createRoleButton.onclick = registerRole;
  } else {
    console.warn("Elemento createRoleButton no encontrado");
  }
  
  const updateRoleButton = document.getElementById("updateRoleButton");
  if (updateRoleButton) {
    updateRoleButton.onclick = updateRole;
  } else {
    console.warn("Elemento updateRoleButton no encontrado");
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchRole);
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
window.validatePermissions = validatePermissions;
window.clearValidationErrors = clearValidationErrors;
window.disableNativeBrowserValidation = disableNativeBrowserValidation;
window.fillEditForm = fillEditForm;
window.updateRoleStatus = updateRoleStatus;
window.deleteRole = deleteRole;
window.openModal = openModal;
window.closeModal = closeModal;
window.searchRole = searchRole;
window.showPermissionsDetails = showPermissionsDetails;
window.togglePermissionCategory = togglePermissionCategory;
window.selectAllPermissions = selectAllPermissions;
window.deselectAllPermissions = deselectAllPermissions;
window.hideLoadingIndicator = hideLoadingIndicator;