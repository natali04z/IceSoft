const API_URL = "https://backend-icesoft.onrender.com/api/roles";

// Objeto para almacenar los permisos por categoría (con permisos de roles corregidos)
const permissionCategories = {
  roles: ['view_roles', 'create_roles', 'update_roles', 'delete_roles'],
  users: ['create_users', 'view_users', 'view_users_id', 'update_users', 'delete_users'],
  categories: ['view_categories', 'view_categories_id', 'create_categories', 'update_categories', 'delete_categories'],
  products: ['view_products', 'view_products_id', 'create_products', 'edit_products', 'delete_products'],
  providers: ['view_providers', 'view_providers_id', 'create_providers', 'update_providers', 'delete_providers'],
  purchases: ['view_purchases', 'view_purchases_id', 'create_purchases', 'update_purchases', 'delete_purchases'],
  branches: ['view_branches', 'create_branches', 'update_branches', 'delete_branches'],
  customers: ['view_customers', 'view_customers_id', 'create_customers', 'update_customers', 'delete_customers'],
  sales: ['view_sales', 'view_sales_id', 'create_sales', 'update_sales', 'delete_sales']
};

// Añadir la definición faltante de permissionsByRole (con permisos de roles corregidos)
const permissionsByRole = {
  admin: ["view_roles", "create_roles", "update_roles", "delete_roles", "create_users", "view_users", "view_users_id", "update_users", "delete_users",
          "view_categories", "view_categories_id", "create_categories", "update_categories", "delete_categories",
          "view_products", "view_products_id", "create_products", "edit_products", "delete_products",
          "view_providers", "view_providers_id", "create_providers", "update_providers", "delete_providers",
          "view_purchases", "view_purchases_id", "create_purchases", "update_purchases", "delete_purchases",
          "view_branches", "create_branches", "update_branches", "delete_branches", 
          "view_customers", "view_customers_id", "create_customers", "update_customers", "delete_customers",
          "view_sales", "view_sales_id", "create_sales", "update_sales", "delete_sales"],
  assistant: ["view_roles", "create_users", "view_users", "view_users_id", "update_users",
          "view_categories", "create_categories", "update_categories", "view_customers",
          "view_products", "view_products_id", "create_products", "edit_products", "delete_products",
          "view_providers", "view_providers_id", "create_providers", "update_providers",
          "view_purchases", "view_purchases_id", "create_purchases", "update_purchases",
          "view_customers", "view_customers_id", "create_customers", "update_customers",
          "view_sales", "view_sales_id", "create_sales", "update_sales"],
  employee: ["view_categories", "view_products", "view_products_id", "create_products", "edit_products", "delete_products", "view_customers", "view_sales", "view_customers_id", "create_sales", "update_sales"]
};

// Variables globales
let roles = [];
let selectedRole = null;

// Función para obtener nombre del usuario loggeado
const getLoggedUserName = () => {
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      const userNameElement = document.getElementById("userName");
      if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
      }
    }
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
  }
};

// Verificar conexión con la API
const checkApiConnection = async () => {
  try {
    const response = await fetch(`${API_URL}`, { 
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.ok;
  } catch (error) {
    console.error("Error al verificar conexión con API:", error);
    return false;
  }
};

// Función para formatear el nombre del permiso para mostrar
const formatPermissionName = (permission) => {
  return permission
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Función para listar roles
const listRoles = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token no encontrado en localStorage");
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(`${API_URL}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("Respuesta del servidor status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error en respuesta:", errorText);
      showError(`Error al obtener roles: ${res.status} ${res.statusText}`);
      return;
    }
    
    const data = await res.json();
    console.log("Datos de respuesta:", data);
    
    // Verificar la estructura de la respuesta
    if (data && data.roles && Array.isArray(data.roles)) {
      roles = data.roles;
    } else if (data && Array.isArray(data)) {
      roles = data;
    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
      roles = [data];
    } else {
      roles = [];
      console.error("Formato de datos no esperado:", data);
    }
    
    renderRolesTable();
  } catch (err) {
    console.error("Error al listar roles:", err);
    showError("Error al listar roles: " + (err.message || err));
  }
};

// Renderizar tabla de roles (modificada para usar viewRolePermissions)
const renderRolesTable = () => {
  const tbody = document.getElementById("rolesTableBody");
  if (!tbody) {
    console.error("No se encontró el elemento 'rolesTableBody'");
    return;
  }
  
  tbody.innerHTML = "";
  
  if (roles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" class="text-center">No hay roles disponibles</td>
      </tr>
    `;
    return;
  }
  
  roles.forEach(role => {
    // Manejar diferentes formatos de datos
    const roleName = typeof role === 'string' ? role : (role.name || 'Sin nombre');
    const roleId = role._id || '';
    
    const row = document.createElement("tr");
    row.className = "role-row";
    if (selectedRole && (selectedRole === roleName || (selectedRole._id && selectedRole._id === roleId))) {
      row.classList.add("selected");
    }
    
    row.innerHTML = `
      <td>${roleName.charAt(0).toUpperCase() + roleName.slice(1)}</td>
      <td>
        <div class="action-buttons">
          <button onclick="viewRolePermissions('${roleId || roleName}')" class="icon-button view-button" title="Ver permisos">
            <i class="material-icons">visibility</i>
          </button>
          ${roleName !== 'admin' && roleName !== 'assistant' && roleName !== 'employee' ? 
            `<button onclick="editRole('${roleId}')" class="icon-button edit-button" title="Editar permisos">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteRole('${roleId}')" class="icon-button delete-button" title="Eliminar rol">
              <i class="material-icons">delete</i>
            </button>` : ''}
        </div>
      </td>
    `;
    
    row.addEventListener("click", () => viewRolePermissions(roleId || roleName));
    tbody.appendChild(row);
  });
};

// Nueva función para ver permisos en modal
const viewRolePermissions = async (roleIdOrName) => {
  try {
    // Evitar que se propague el evento a la fila
    if (event) {
      event.stopPropagation();
    }
    
    // Buscar el rol en la lista de roles
    let role;
    
    if (typeof roleIdOrName === 'string' && roleIdOrName.length === 24) {
      // Parece ser un ID de MongoDB
      role = roles.find(r => r._id === roleIdOrName);
    } else {
      // Parece ser un nombre de rol
      role = roles.find(r => {
        return typeof r === 'string' ? r === roleIdOrName : r.name === roleIdOrName;
      });
    }
    
    if (!role) {
      console.error("Rol no encontrado:", roleIdOrName);
      showError("Rol no encontrado");
      return;
    }
    
    selectedRole = role;
    renderRolesTable(); // Actualizar selección en la tabla
    
    // Actualizar el nombre del rol en el modal
    const modalRoleName = document.getElementById("modalRoleName");
    if (modalRoleName) {
      const roleName = typeof role === 'string' ? role : role.name;
      modalRoleName.textContent = roleName.charAt(0).toUpperCase() + roleName.slice(1);
    }
    
    // Renderizar permisos en el modal
    renderPermissionsInModal(role);
    
    // Abrir el modal
    openModal('viewPermissionsModal');
    
    // Configurar eventos para las pestañas del modal
    setupModalTabs();
    
  } catch (error) {
    console.error("Error al ver permisos del rol:", error);
    showError("Error al ver permisos del rol: " + error.message);
  }
};

// Función para renderizar permisos en el modal
const renderPermissionsInModal = (role) => {
  // Obtener los permisos del rol
  let rolePermissions = [];
  
  // Determinar el nombre del rol para búsqueda en predefinidos
  const roleName = typeof role === 'string' ? role : role.name;
  
  // Primero verificar si es un rol predefinido
  if (permissionsByRole[roleName]) {
    rolePermissions = permissionsByRole[roleName];
  } else if (typeof role === 'string') {
    // Rol por nombre que no es predefinido
    rolePermissions = [];
  } else if (role && role.permissions) {
    // Es un objeto de rol con permisos
    rolePermissions = role.permissions.map(p => typeof p === 'string' ? p : p.name);
  }
  
  // Recorrer cada categoría y mostrar sus permisos
  Object.entries(permissionCategories).forEach(([category, permissions]) => {
    const container = document.getElementById(`view${category.charAt(0).toUpperCase() + category.slice(1)}Permissions`);
    if (!container) return;
    
    container.innerHTML = "";
    
    permissions.forEach(permission => {
      const hasPermission = rolePermissions.includes(permission);
      
      const permissionItem = document.createElement("div");
      permissionItem.className = "permission-item";
      
      if (hasPermission) {
        permissionItem.classList.add("has-permission");
      }
      
      permissionItem.innerHTML = `
        <div class="permission-checkbox ${hasPermission ? 'checked' : ''}">
          <i class="material-icons">${hasPermission ? 'check_box' : 'check_box_outline_blank'}</i>
        </div>
        <label>${formatPermissionName(permission)}</label>
      `;
      
      container.appendChild(permissionItem);
    });
  });
};

// Configurar eventos para las pestañas del modal
const setupModalTabs = () => {
  const tabButtons = document.querySelectorAll('.view-tab-button');
  tabButtons.forEach(button => {
    // Eliminar listeners previos si existen
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    newButton.addEventListener('click', () => {
      // Quitar clase active de todos los botones y contenidos
      document.querySelectorAll('.view-tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.view-permission-group').forEach(group => group.classList.remove('active'));
      
      // Añadir active al botón clickeado
      newButton.classList.add('active');
      
      // Activar el contenido correspondiente
      const category = newButton.dataset.category;
      const permissionGroup = document.getElementById(`view${category.charAt(0).toUpperCase() + category.slice(1)}Permissions`);
      if (permissionGroup) {
        permissionGroup.classList.add('active');
      }
    });
  });
};

// Seleccionar un rol para ver sus permisos (ahora utiliza viewRolePermissions)
const selectRole = async (roleIdOrName) => {
  viewRolePermissions(roleIdOrName);
};

// Inicializar el modal para crear un rol
const initializeRoleModal = () => {
  // Generar checkboxes de permisos para cada categoría
  Object.entries(permissionCategories).forEach(([category, permissions]) => {
    const container = document.getElementById(`${category}PermissionsGroup`);
    if (!container) return;
    
    container.innerHTML = "";
    
    permissions.forEach(permission => {
      const permissionItem = document.createElement("div");
      permissionItem.className = "permission-item";
      permissionItem.innerHTML = `
        <input type="checkbox" id="new_${permission}" name="permissions" value="${permission}">
        <label for="new_${permission}">${formatPermissionName(permission)}</label>
      `;
      
      container.appendChild(permissionItem);
    });
  });
  
  // Configurar eventos para las pestañas
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Quitar clase active de todos los botones y contenidos
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.permission-group').forEach(group => group.classList.remove('active'));
      
      // Añadir active al botón clickeado
      button.classList.add('active');
      
      // Activar el contenido correspondiente
      const category = button.dataset.category;
      const permissionGroup = document.getElementById(`${category}PermissionsGroup`);
      if (permissionGroup) {
        permissionGroup.classList.add('active');
      }
    });
  });
};

// Registrar un nuevo rol con permisos personalizados
const registerRole = async () => {
  try {
    const roleName = document.getElementById("roleName").value.trim().toLowerCase();
    
    if (!roleName) {
      showValidation("Debes ingresar un nombre para el rol.");
      return;
    }
    
    // Verificar si el rol ya existe
    if (roles.some(role => {
      if (typeof role === 'string') {
        return role.toLowerCase() === roleName;
      } else {
        return role.name && role.name.toLowerCase() === roleName;
      }
    })) {
      showError("Este rol ya existe en el sistema.");
      return;
    }
    
    // Recopilar permisos seleccionados
    const checkboxes = document.querySelectorAll('input[name="permissions"]:checked');
    const selectedPermissions = Array.from(checkboxes).map(checkbox => checkbox.value);
    
    if (selectedPermissions.length === 0) {
      showValidation("Debes seleccionar al menos un permiso para el rol.");
      return;
    }
    
    const confirmed = await showConfirm({
      title: "¿Confirmas registrar este rol?",
      text: `Se creará un nuevo rol "${roleName}" con ${selectedPermissions.length} permisos seleccionados.`,
      confirmText: "Registrar",
      cancelText: "Cancelar"
    });
    
    if (!confirmed) {
      Swal.fire({
        icon: 'info',
        title: 'Operación cancelada',
        text: 'No se ha registrado ningún rol',
      });
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    // Hacer la solicitud para crear el rol
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        name: roleName,
        permissions: selectedPermissions
      })
    });
    
    console.log("Respuesta al registrar rol:", res.status);
    
    if (!res.ok) {
      const errorData = await res.json();
      showError(errorData.message || "Error al registrar rol.");
      return;
    }
    
    const data = await res.json();
    console.log("Datos de respuesta al registrar:", data);
    
    showSuccess("Rol registrado correctamente.");
    closeModal('registerRoleModal');
    document.getElementById("roleForm").reset();
    listRoles(); // Actualizar lista de roles
  } catch (err) {
    console.error("Error al registrar rol:", err);
    showError("Error al registrar rol: " + (err.message || err));
  }
};

// Función para editar un rol existente
const editRole = async (roleId) => {
  try {
    // Evitar que se propague el evento a la fila
    event.stopPropagation();
    
    // Buscar el rol por ID
    const role = roles.find(r => r._id === roleId);
    if (!role) {
      showError("Rol no encontrado.");
      return;
    }
    
    // Preparar el modal para edición
    document.getElementById("editRoleName").value = role.name;
    document.getElementById("editRoleId").value = roleId;
    
    // Limpiar todas las selecciones anteriores
    document.querySelectorAll('input[name="editPermissions"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Marcar los permisos que el rol ya tiene
    const rolePermissions = role.permissions.map(p => typeof p === 'string' ? p : p.name);
    
    rolePermissions.forEach(permission => {
      const checkbox = document.getElementById(`edit_${permission}`);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
    
    // Mostrar el modal de edición
    openModal('editRoleModal');
  } catch (error) {
    console.error("Error al preparar edición de rol:", error);
    showError("Error al preparar edición de rol: " + error.message);
  }
};

// Función para actualizar un rol existente
const updateRole = async () => {
  try {
    const roleId = document.getElementById("editRoleId").value;
    const roleName = document.getElementById("editRoleName").value.trim().toLowerCase();
    
    if (!roleName) {
      showValidation("El nombre del rol no puede estar vacío.");
      return;
    }
    
    // Recopilar permisos seleccionados
    const checkboxes = document.querySelectorAll('input[name="editPermissions"]:checked');
    const selectedPermissions = Array.from(checkboxes).map(checkbox => checkbox.value);
    
    if (selectedPermissions.length === 0) {
      showValidation("Debes seleccionar al menos un permiso para el rol.");
      return;
    }
    
    const confirmed = await showConfirm({
      title: "¿Confirmas actualizar este rol?",
      text: `Se actualizará el rol "${roleName}" con ${selectedPermissions.length} permisos.`,
      confirmText: "Actualizar",
      cancelText: "Cancelar"
    });
    
    if (!confirmed) {
      Swal.fire({
        icon: 'info',
        title: 'Operación cancelada',
        text: 'No se ha actualizado el rol',
      });
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    // Hacer la solicitud para actualizar el rol
    const res = await fetch(`${API_URL}/${roleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        name: roleName,
        permissions: selectedPermissions
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      showError(errorData.message || "Error al actualizar rol.");
      return;
    }
    
    const data = await res.json();
    console.log("Datos de respuesta al actualizar:", data);
    
    showSuccess("Rol actualizado correctamente.");
    closeModal('editRoleModal');
    listRoles(); // Actualizar lista de roles
    
    // Si el rol que se editó es el que está seleccionado, actualizar la vista
    if (selectedRole && selectedRole._id === roleId) {
      selectRole(roleId);
    }
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    showError("Error al actualizar rol: " + error.message);
  }
};

// Función para eliminar un rol
const deleteRole = async (roleId) => {
  try {
    // Evitar que se propague el evento a la fila
    event.stopPropagation();
    
    const confirmed = await showConfirm({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el rol permanentemente. Los usuarios con este rol perderán sus permisos.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      icon: "warning"
    });
    
    if (!confirmed) {
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    // Hacer la solicitud para eliminar el rol
    const res = await fetch(`${API_URL}/${roleId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      showError(errorData.message || "Error al eliminar rol.");
      return;
    }
    
    showSuccess("Rol eliminado correctamente.");
    
    // Si el rol eliminado era el seleccionado, limpiar la vista
    if (selectedRole && selectedRole._id === roleId) {
      selectedRole = null;
      const selectMessage = document.getElementById("selectRoleMessage");
      const permissionsCategories = document.getElementById("permissionsCategories");
      
      if (selectMessage) {
        selectMessage.style.display = "block";
      }
      
      if (permissionsCategories) {
        permissionsCategories.style.display = "none";
      }
    }
    
    listRoles(); // Actualizar lista de roles
  } catch (error) {
    console.error("Error al eliminar rol:", error);
    showError("Error al eliminar rol: " + error.message);
  }
};

// Función para abrir modal (modificada para manejar el modal de permisos)
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
    
    // Si es el modal de registro, inicializar el contenido
    if (modalId === 'registerRoleModal') {
      initializeRoleModal();
    }
    // Si es el modal de edición, inicializar el contenido
    else if (modalId === 'editRoleModal') {
      initializeEditRoleModal();
    }
    // Si es el modal de visualización de permisos, configurar pestañas
    else if (modalId === 'viewPermissionsModal') {
      setupModalTabs();
    }
  }
}

// Inicializar el modal de edición de rol
const initializeEditRoleModal = () => {
  // Generar checkboxes de permisos para cada categoría
  Object.entries(permissionCategories).forEach(([category, permissions]) => {
    const container = document.getElementById(`edit${category.charAt(0).toUpperCase() + category.slice(1)}PermissionsGroup`);
    if (!container) return;
    
    container.innerHTML = "";
    
    permissions.forEach(permission => {
      const permissionItem = document.createElement("div");
      permissionItem.className = "permission-item";
      permissionItem.innerHTML = `
        <input type="checkbox" id="edit_${permission}" name="editPermissions" value="${permission}">
        <label for="edit_${permission}">${formatPermissionName(permission)}</label>
      `;
      
      container.appendChild(permissionItem);
    });
  });
  
  // Configurar eventos para las pestañas
  const tabButtons = document.querySelectorAll('.edit-tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Quitar clase active de todos los botones y contenidos
      document.querySelectorAll('.edit-tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.edit-permission-group').forEach(group => group.classList.remove('active'));
      
      // Añadir active al botón clickeado
      button.classList.add('active');
      
      // Activar el contenido correspondiente
      const category = button.dataset.category;
      const permissionGroup = document.getElementById(`edit${category.charAt(0).toUpperCase() + category.slice(1)}PermissionsGroup`);
      if (permissionGroup) {
        permissionGroup.classList.add('active');
      }
    });
  });
};

// Función para cerrar modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    
    // Si es el modal de registro, resetear el formulario
    if (modalId === 'registerRoleModal') {
      document.getElementById("roleForm").reset();
    }
    // Si es el modal de edición, resetear el formulario
    else if (modalId === 'editRoleModal') {
      document.getElementById("editRoleForm").reset();
    }
  }
}

// Función para alternar el menú desplegable del usuario
function toggleUserDropdown() {
  const dropdown = document.getElementById("userDropdown");
  if (dropdown) {
    dropdown.classList.toggle("show");
  }
}

// Función de inicio
const init = async () => {
  // Verificar conexión a la API
  const isConnected = await checkApiConnection();
  
  if (!isConnected) {
    showError("No se pudo establecer conexión con el servidor. Verifique su conexión a Internet.");
    return;
  }
  
  // Obtener nombre de usuario
  getLoggedUserName();
  
  // Listar roles
  listRoles();
};

// Event listeners cuando se carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar
  init();
  
  // Event listeners para botones
  const addRoleButton = document.getElementById("addRoleButton");
  if (addRoleButton) {
    addRoleButton.addEventListener("click", () => openModal('registerRoleModal'));
  }
  
  const registerRoleButton = document.getElementById("registerRoleButton");
  if (registerRoleButton) {
    registerRoleButton.addEventListener("click", registerRole);
  }
  
  const updateRoleButton = document.getElementById("updateRoleButton");
  if (updateRoleButton) {
    updateRoleButton.addEventListener("click", updateRole);
  }
  
  // Event listener para cerrar modales
  const closeButtons = document.querySelectorAll(".close-button");
  closeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal) {
        modal.style.display = "none";
      }
    });
  });
});

// Hacer funciones accesibles de forma global
window.selectRole = selectRole;
window.editRole = editRole;
window.deleteRole = deleteRole;
window.openModal = openModal;
window.closeModal