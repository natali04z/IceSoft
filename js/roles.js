const API_URL = "https://backend-alpha-orpin-58.vercel.app/api/roles";
  
let allRoles = [];
let originalRoles = [];
let currentPage = 1;
const rowsPerPage = 10;

function getDisplayNameForRole(roleName) {
  const roleTranslations = {
    "admin": "Administrador",
    "assistant": "Asistente",
    "employee": "Empleado"
  };
  
  return roleTranslations[roleName] || roleName;
}

function validateField(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = errorMessage || "El campo es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("roles-input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("roles-input-error");
    return true;
  }
}

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

function clearValidationErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const errorElements = form.querySelectorAll('.roles-error-message');
  const inputElements = form.querySelectorAll('.roles-field-element');
  
  errorElements.forEach(element => {
    element.style.display = "none";
  });
  
  inputElements.forEach(element => {
    element.classList.remove("roles-input-error");
  });
}

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

function isAdminRole(roleId) {
  const role = allRoles.find(r => (r._id || r.id) === roleId) || 
               originalRoles.find(r => (r._id || r.id) === roleId);
  return role && role.name === 'admin';
}

function isDefaultRole(roleId) {
  const role = allRoles.find(r => (r._id || r.id) === roleId) || 
               originalRoles.find(r => (r._id || r.id) === roleId);
  
  if (role) {
    const isDefault = role.isDefault || ['admin', 'assistant', 'employee'].includes(role.name);
    return {
      isDefault: isDefault,
      name: role.name,
      role: role
    };
  }
  
  return { isDefault: false };
}

function preventEventPropagation(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
}

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

function formatPermissions(permissions, roleId) {
  if (!permissions || permissions.length === 0) return '-';
  
  return `<button class="roles-view-details-btn" onclick="event.stopPropagation(); showPermissionsDetails('${roleId}', event)">
            <i class="material-icons">visibility</i> 
            Ver ${permissions.length} permisos
          </button>`;
}

function showPermissionsDetails(roleId, event) {
  preventEventPropagation(event);
  
  try {
    const role = allRoles.find(r => r._id === roleId);
    if (!role || !role.permissions) {
      showError("No se encontraron permisos para este rol");
      return;
    }
    
    const groupedPermissions = {};
    let totalPermissions = 0;
    
    if (role.permissions.length > 0) {
      role.permissions.forEach(perm => {
        totalPermissions++;
        
        let category = 'otros';
        let permissionName = '';
        let permissionCode = '';
        
        if (typeof perm === 'object' && perm !== null) {
          permissionName = perm.name || 'Sin nombre';
          permissionCode = perm.code || '';
          
          if (perm.code) {
            const codeParts = perm.code.split('_');
            category = codeParts[0] || 'otros';
          }
        } else if (typeof perm === 'string') {
          permissionCode = perm;
          permissionName = perm;
          const codeParts = perm.split('_');
          category = codeParts[0] || 'otros';
        }
        
        let categoryName = 'Otros';
        
        if (permissionCode.includes('usuario') || permissionCode.includes('user')) {
          categoryName = 'Usuarios';
        } else if (permissionCode.includes('categories') || permissionCode.includes('categoria') || permissionCode.includes('category')) {
          categoryName = 'Categorías';
        } else if (permissionCode.includes('proveedor') || permissionCode.includes('supplier') || permissionCode.includes('provider')) {
          categoryName = 'Proveedores';
        } else if (permissionCode.includes('producto') || permissionCode.includes('product')) {
          categoryName = 'Productos';
        } else if (permissionCode.includes('compra') || permissionCode.includes('purchase')) {
          categoryName = 'Gestión de Compras';
        } else if (permissionCode.includes('cliente') || permissionCode.includes('client') || permissionCode.includes('customer')) {
          categoryName = 'Clientes';
        } else if (permissionCode.includes('sucursal') || permissionCode.includes('branch')) {
          categoryName = 'Sucursales';
        } else if (permissionCode.includes('venta') || permissionCode.includes('sale')) {
          categoryName = 'Gestión de Ventas';
        } else if (permissionCode.includes('role') || permissionCode.includes('rol')) {
          categoryName = 'Roles';
        } else if (permissionCode.includes('permiso') || permissionCode.includes('permission')) {
          categoryName = 'Permisos';
        }
        
        if (!groupedPermissions[categoryName]) {
          groupedPermissions[categoryName] = [];
        }
        
        groupedPermissions[categoryName].push({
          name: permissionName,
          code: permissionCode
        });
      });
    }
    
    let permissionsHTML = '';
    const moduleCount = Object.keys(groupedPermissions).length;
    
    if (moduleCount === 0) {
      permissionsHTML = `
        <div class="roles-no-permissions">
          <i class="material-icons">info</i>
          <p>Este rol no tiene permisos asignados</p>
        </div>
      `;
    } else {
      for (const [categoryName, perms] of Object.entries(groupedPermissions)) {
        const categoryId = `roles-view-category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
        
        permissionsHTML += `
          <div class="roles-permission-section-view">
            <div class="roles-permission-category-header-view" onclick="toggleViewPermissionCategory('${categoryId}')">
              <h5>${categoryName} <span>(${perms.length})</span></h5>
              <i class="material-icons roles-category-toggle">expand_less</i>
            </div>
            <div id="${categoryId}" class="roles-permission-items-view" style="display: block;">
              ${perms.map(p => `
                <div class="roles-permission-item-view">
                  <i class="material-icons roles-permission-icon">check_circle</i>
                  <div class="roles-permission-info">
                    <span class="roles-permission-name">${p.name}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    }
    
    const displayRoleName = getDisplayNameForRole(role.name);
    
    Swal.fire({
      // Sin título aquí
      html: `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Permisos de ${displayRoleName}</h3>
            <button type="button" class="modal-close" onclick="Swal.close()">
              <i class="material-icons">close</i>
            </button>
          </div>
          <div class="modal-body">
            <div class="roles-permissions-container-view">
              ${permissionsHTML}
            </div>
          </div>
        </div>
      `,
      width: '500px',
      showCloseButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        container: 'roles-permissions-view-modal-container',
        popup: 'roles-permissions-view-modal-popup'
      },
      didOpen: () => {
        // Eliminar completamente todos los paddings y margins
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.setProperty('padding', '0', 'important');
          popup.style.setProperty('margin', '0', 'important');
          popup.style.setProperty('border-radius', '8px', 'important');
          
          // Eliminar padding del contenedor HTML
          const htmlContainer = popup.querySelector('.swal2-html-container');
          if (htmlContainer) {
            htmlContainer.style.setProperty('padding', '0', 'important');
            htmlContainer.style.setProperty('margin', '0', 'important');
            htmlContainer.style.setProperty('overflow', 'hidden', 'important');
          }
          
          // Eliminar padding del contenedor principal
          const container = popup.querySelector('.modal-content');
          if (container) {
            container.style.setProperty('margin', '0', 'important');
            container.style.setProperty('width', '100%', 'important');
          }
        }
      }
    });
    
  } catch (err) {
    console.error("Error al mostrar detalles de permisos:", err);
    showError("Error al cargar los detalles de permisos");
  }
}

function toggleViewPermissionCategory(categoryId) {
  const category = document.getElementById(categoryId);
  if (!category) return;
  
  const header = category.previousElementSibling;
  const icon = header ? header.querySelector('.roles-category-toggle') : null;
  
  const isCurrentlyVisible = category.style.display === 'block' || 
                            (!category.style.display && getComputedStyle(category).display !== 'none');
  
  if (isCurrentlyVisible) {
    category.style.display = 'none';
    if (icon) icon.textContent = 'expand_more';
  } else {
    category.style.display = 'block';
    if (icon) icon.textContent = 'expand_less';
  }
}

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
        <td colspan="5" class="text-center">
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
  const canDeleteRoles = userPermissions.includes("delete_roles");
  
  let tableContent = '';

  rolesToShow.forEach((role, index) => {
    try {
      const roleId = role._id || "";
      const displayId = role.id || roleId || `Ro${String(index + 1).padStart(2, '0')}`;
      const status = role.status || "active";
      
      const isAdmin = role.name === 'admin';
      const isAdminClass = isAdmin ? 'role-admin' : '';
      const adminBadge = isAdmin ? '<span class="admin-badge"></span>' : '';
      
      const displayRoleName = getDisplayNameForRole(role.name || '');
      
      tableContent += `
        <tr data-roleid="${roleId}" data-index="${index}" class="${isAdminClass}">
          <td class="id-column">${displayId}</td>
          <td>${displayRoleName} ${adminBadge}</td>
          <td>${formatPermissions(role.permissions, roleId)}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                ${canEditRoles && !isAdmin ? `onchange="updateRoleStatus('${roleId}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${roleId}')" class="icon-button edit-button" title="Editar rol">
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deleteRole('${roleId}')" class="icon-button delete-button" title="Eliminar rol">
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
            Error al renderizar este rol: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  renderPaginationControls();
};

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

  // Lógica para mostrar máximo 5 páginas visibles
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Ajustar startPage si estamos cerca del final
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // Mostrar página 1 si no está en el rango visible
  if (startPage > 1) {
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    btn.innerText = "1";
    btn.onclick = () => changePage(1);
    container.appendChild(btn);
    
    // Agregar puntos suspensivos si hay gap
    if (startPage > 2) {
      const dots = document.createElement("div");
      dots.classList.add("page-dots");
      dots.innerText = "...";
      container.appendChild(dots);
    }
  }
  
  // Mostrar páginas en el rango visible
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    if (i === currentPage) btn.classList.add("active");
    btn.innerText = i;
    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }
  
  // Mostrar última página si no está en el rango visible
  if (endPage < totalPages) {
    // Agregar puntos suspensivos si hay gap
    if (endPage < totalPages - 1) {
      const dots = document.createElement("div");
      dots.classList.add("page-dots");
      dots.innerText = "...";
      container.appendChild(dots);
    }
    
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    btn.innerText = totalPages;
    btn.onclick = () => changePage(totalPages);
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

const changePage = (page) => {
  currentPage = page;
  renderRolesTable(currentPage);
};

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
            <td colspan="5" class="text-center">
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

const listRoles = async () => {
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
            <td colspan="5" class="text-center">
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

const loadPermissionsForForm = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch("https://backend-alpha-orpin-58.vercel.app/api/permissions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      const permissions = data.permissions || data;
      
      const groupedPermissions = {
        'usuarios': [],
        'categorias': [],
        'proveedores': [],
        'productos': [],
        'gestion-compras': [],
        'clientes': [],
        'sucursales': [],
        'gestion-ventas': [],
        'roles': [],
        'permisos': [],
        'otros': []
      };
      
      permissions.forEach(permission => {
        if (permission.status !== "active") return;
        
        const permissionCode = permission.code || '';
        
        let categoryName = 'otros';
        
        if (permissionCode.includes('usuario') || permissionCode.includes('user')) {
          categoryName = 'usuarios';
        } else if (permissionCode.includes('categories') || permissionCode.includes('categoria') || permissionCode.includes('category')) {
          categoryName = 'categorias';
        } else if (permissionCode.includes('proveedor') || permissionCode.includes('supplier') || permissionCode.includes('provider')) {
          categoryName = 'proveedores';
        } else if (permissionCode.includes('producto') || permissionCode.includes('product')) {
          categoryName = 'productos';
        } else if (permissionCode.includes('compra') || permissionCode.includes('purchase')) {
          categoryName = 'gestion-compras';
        } else if (permissionCode.includes('cliente') || permissionCode.includes('client') || permissionCode.includes('customer')) {
          categoryName = 'clientes';
        } else if (permissionCode.includes('sucursal') || permissionCode.includes('branch')) {
          categoryName = 'sucursales';
        } else if (permissionCode.includes('venta') || permissionCode.includes('sale')) {
          categoryName = 'gestion-ventas';
        } else if (permissionCode.includes('role') || permissionCode.includes('rol')) {
          categoryName = 'roles';
        } else if (permissionCode.includes('permiso') || permissionCode.includes('permission')) {
          categoryName = 'permisos';
        }
        
        groupedPermissions[categoryName].push(permission);
      });

      fillPermissionsInForm('roles-category-', 'permissions', groupedPermissions);
      fillPermissionsInForm('roles-edit-category-', 'editPermissions', groupedPermissions);
      
    } else {
      showError(data.message || "Error al cargar permisos.");
    }
  } catch (err) {
    console.error("Error al cargar permisos:", err);
    showError("Error al cargar permisos: " + (err.message || err));
  }
};

function fillPermissionsInForm(categoryPrefix, inputName, groupedPermissions) {
  const categories = ['usuarios', 'categorias', 'proveedores', 'productos', 'gestion-compras', 'clientes', 'sucursales', 'gestion-ventas', 'roles', 'permisos', 'otros'];
  
  categories.forEach(category => {
    const container = document.getElementById(`${categoryPrefix}${category}`);
    const countElement = document.getElementById(`${inputName === 'permissions' ? '' : 'edit-'}${category}-count`);
    
    if (container && groupedPermissions[category]) {
      const permissions = groupedPermissions[category];
      
      if (countElement) {
        countElement.textContent = `(${permissions.length})`;
      }
      
      container.innerHTML = permissions.map(permission => `
        <div class="roles-checkbox-container">
          <input type="checkbox" id="${inputName === 'permissions' ? 'perm' : 'edit'}-${permission._id}" value="${permission._id}" name="${inputName}">
          <label for="${inputName === 'permissions' ? 'perm' : 'edit'}-${permission._id}">${permission.name}</label>
        </div>
      `).join('');
    }
  });
}

function togglePermissionCategory(categoryId) {
  const category = document.getElementById(categoryId);
  const header = category.previousElementSibling;
  const icon = header.querySelector('.roles-category-toggle');
  
  if (category.style.display === 'none') {
    category.style.display = 'grid';
    icon.textContent = 'expand_more';
  } else {
    category.style.display = 'none';
    icon.textContent = 'expand_less';
  }
}

function selectAllPermissions(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
}

function deselectAllPermissions(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
}

function marcarPermisosEnFormulario(permisos) {
  const allCheckboxes = document.querySelectorAll('input[name="editPermissions"]');
  
  allCheckboxes.forEach(checkbox => checkbox.checked = false);
  
  if (!permisos || !Array.isArray(permisos) || permisos.length === 0) {
    return;
  }
  
  const permisosIds = new Set();
  permisos.forEach(perm => {
    if (typeof perm === 'object' && perm !== null) {
      if (perm._id) permisosIds.add(perm._id);
      if (perm.id) permisosIds.add(perm.id);
    } else if (typeof perm === 'string') {
      permisosIds.add(perm);
    }
  });
  
  allCheckboxes.forEach(checkbox => {
    if (permisosIds.has(checkbox.value)) {
      checkbox.checked = true;
      
      const categoryItem = checkbox.closest('.roles-permission-items');
      if (categoryItem && categoryItem.style.display === 'none') {
        categoryItem.style.display = 'grid';
        const header = categoryItem.previousElementSibling;
        if (header) {
          const icon = header.querySelector('.roles-category-toggle');
          if (icon) icon.textContent = 'expand_more';
        }
      }
    }
  });
}

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

const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  try {
    clearValidationErrors('editRoleForm');
    
    let role = allRoles.find(r => (r._id || r.id) === id);
    
    if (!role) {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        showError(errorData.message || "Error al cargar los datos del rol.");
        return;
      }

      const responseData = await res.json();
      role = responseData.role || responseData;
    }

    if (!role || !(role._id || role.id)) {
      showError("Error: datos del rol no encontrados.");
      return;
    }

    if (role.name === 'admin') {
      showValidation('El rol Administrador no puede ser editado porque es utilizado internamente por el sistema.');
      return;
    }

    document.getElementById("editId").value = role._id || role.id;
    document.getElementById("editName").value = getDisplayNameForRole(role.name || "");
    
    const editDescriptionElement = document.getElementById("editDescription");
    if (editDescriptionElement) {
      editDescriptionElement.value = role.description || "";
    }
    
    openModal('editRoleModal');
    
    setTimeout(() => {
      marcarPermisosEnFormulario(role.permissions || []);
    }, 100);
    
  } catch (err) {
    showError(`Error al cargar el rol: ${err.message || err}`);
  }
};

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

const updateRoleStatus = async (id, newStatus) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const role = allRoles.find(r => (r._id || r.id) === id) || originalRoles.find(r => (r._id || r.id) === id);
  
  // Validación para el rol administrador - no puede ser desactivado
  if (role && role.name === 'admin') {
    showValidation('El rol Administrador no puede ser modificado porque es utilizado internamente por el sistema.');
    
    // Revertir el switch a su estado anterior
    setTimeout(() => {
      const switchElement = document.querySelector(`tr[data-roleid="${id}"] input[type="checkbox"]`);
      if (switchElement) {
        switchElement.checked = true; // El admin siempre debe estar activo
      }
    }, 100);
    
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
      body: JSON.stringify({ status: newStatus })
    });

    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      console.error("Error al parsear JSON:", jsonError);
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      showSuccess(`Rol ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente.`);
      
      if (switchElement) {
        switchElement.checked = newStatus === 'active';
      }
      
      const roleIndex = allRoles.findIndex(r => (r._id || r.id) === id);
      if (roleIndex !== -1) {
        allRoles[roleIndex].status = newStatus;
      }
      
      const originalIndex = originalRoles.findIndex(r => (r._id || r.id) === id);
      if (originalIndex !== -1) {
        originalRoles[originalIndex].status = newStatus;
      }
      
    } else {
      let errorMsg = data.message || `Error al ${newStatus === 'active' ? 'activar' : 'desactivar'} el rol (${res.status})`;
      showError(errorMsg);

      if (switchElement) {
        switchElement.checked = newStatus !== 'active';
      }
    }
  } catch (err) {
    console.error("Error al actualizar estado:", err);
    showError(`Ocurrió un error de red: ${err.message || err}`);
    
    if (switchElement) {
      switchElement.checked = newStatus !== 'active';
    }
  }
};

const toggleRoleStatus = updateRoleStatus;

const deleteRole = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const role = allRoles.find(r => (r._id || r.id) === id) || originalRoles.find(r => (r._id || r.id) === id);
  
  if (role) {
    if (role.name === 'admin') {
      showValidation('El rol Administrador no puede ser eliminado del sistema.');
      return;
    }
    
    if (role.isDefault || ['assistant', 'employee'].includes(role.name)) {
      const roleName = getDisplayNameForRole(role.name);
      showValidation(`El rol ${roleName} es predeterminado del sistema y no puede ser eliminado.`);
      return;
    }
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
      
      if (data.message === "Cannot delete default roles") {
        const roleName = role ? getDisplayNameForRole(role.name) : 'este rol';
        showValidation(`El rol ${roleName} es predeterminado del sistema y no puede ser eliminado.`);
      } else if (data.message && data.message.includes("assigned to users")) {
        const userCount = data.usersCount || 'algunos';
        showError(`No se puede eliminar el rol porque está asignado a ${userCount} usuario(s). Primero debe reasignar o eliminar esos usuarios.`);
      } else if (data.message === "Role not found") {
        showError("El rol que intenta eliminar no existe.");
      } else if (data.message === "Invalid role ID format") {
        showError("ID de rol inválido.");
      } else {
        showError(data.message || "Error desconocido al eliminar el rol.");
      }
    }
  } catch (err) {
    console.error("Error al eliminar rol:", err);
    showError("Error de conexión al eliminar el rol. Verifique su conexión a internet.");
  }
};

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
      const displayNameMatch = getDisplayNameForRole(r.name || '').toLowerCase().includes(term);
      const idMatch = (r.id || r._id) && (r.id || r._id).toLowerCase().includes(term);
      const descriptionMatch = r.description && r.description.toLowerCase().includes(term);
      
      return nameMatch || displayNameMatch || idMatch || descriptionMatch;
    });
  }
  
  currentPage = 1;
  renderRolesTable(currentPage);
};

function showAlert(message, type) {
  let alertContainer = document.getElementById("rolesAlertContainer");
  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.id = "rolesAlertContainer";
    alertContainer.className = "roles-alert-container";
    document.body.appendChild(alertContainer);
  }
  
  const alertElement = document.createElement("div");
  alertElement.className = `roles-alert roles-alert-${type}`;
  alertElement.textContent = message;
  
  const closeButton = document.createElement("span");
  closeButton.className = "roles-alert-close";
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

function initializeValidationEvents() {
  disableNativeBrowserValidation();
  
  const nameField = document.getElementById("name");
  if (nameField) {
    nameField.addEventListener("blur", () => validateField("name", "El nombre es obligatorio."));
  }
  
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

document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;
  
  initializeValidationEvents();
  
  try {
    await loadPermissionsForForm();
  } catch (error) {
    console.error("Error cargando permisos:", error);
  }
  
  try {
    await initializeListPage();
  } catch (error) {
    console.error("Error inicializando página:", error);
  }
});

window.getDisplayNameForRole = getDisplayNameForRole;
window.validateField = validateField;
window.validatePermissions = validatePermissions;
window.clearValidationErrors = clearValidationErrors;
window.disableNativeBrowserValidation = disableNativeBrowserValidation;
window.isAdminRole = isAdminRole;
window.isDefaultRole = isDefaultRole;
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
window.showLoadingIndicator = showLoadingIndicator;
window.toggleViewPermissionCategory = toggleViewPermissionCategory;
window.preventEventPropagation = preventEventPropagation;
window.toggleRoleStatus = toggleRoleStatus;
window.showValidation = showValidation;
window.showConfirm = showConfirm;