// Endpoints de la API
const API_URL = "https://backend-yy4o.onrender.com/api/users";
const API_AUTH = "https://backend-yy4o.onrender.com/api/auth/register";
const API_ROLES = "https://backend-yy4o.onrender.com/api/roles";

// Variables globales para usuarios y paginación
let allUsers = [];
let originalUsers = [];
let currentPage = 1;
const rowsPerPage = 10;

// Función auxiliar para obtener el nombre de rol en español
function getDisplayNameForRole(roleName) {
  const roleTranslations = {
    "admin": "Administrador",
    "assistant": "Asistente",
    "employee": "Empleado"
  };
  
  return roleTranslations[roleName] || roleName;
}

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

// Función para validar contraseña
function validatePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "La contraseña es obligatoria.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (field.value.trim().length < 6) {
    errorElement.textContent = "La contraseña debe tener al menos 6 caracteres.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar rol
function validateRole(fieldId) {
  // Si el fieldId es 'role', usar 'rol' para el formulario de registro
  const actualFieldId = fieldId === 'role' ? 'rol' : fieldId;
  
  const field = document.getElementById(actualFieldId);
  // Usar el fieldId original para el error
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field || !field.value) {
    if (errorElement) {
      errorElement.textContent = "Debe seleccionar un rol.";
      errorElement.style.display = "block";
    }
    if (field) {
      field.classList.add("input-error");
    }
    return false;
  } else {
    if (errorElement) {
      errorElement.style.display = "none";
    }
    if (field) {
      field.classList.remove("input-error");
    }
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
  const userForm = document.getElementById("userForm");
  if (userForm) {
    userForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = userForm.querySelectorAll("input, select");
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
    const inputs = editForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
}

// ===== FUNCIONES DE INTERFAZ DE USUARIO =====

// Función para abrir un modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
  
  // Resetear mensajes de error al abrir el modal
  if (modalId === 'registerModal') {
    clearValidationErrors('userForm');
    document.getElementById("userForm").reset();
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
  }
}

// Función para cerrar un modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Configurar validación para teléfonos
function setupPhoneNumberValidation() {
  const phoneInputs = document.querySelectorAll('#contact_number, #editContact');
  
  phoneInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    // Limpiar el input si de alguna manera entran caracteres no numéricos
    input.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '');
    });
  });
}

// ===== FUNCIONES DE RENDERIZADO =====

// Renderizar tabla de usuarios
const renderUsersTable = (page = 1) => {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const usersToShow = allUsers.slice(start, end);

  usersToShow.forEach(user => {
    const roleName = user.role?.displayName || user.role?.name || "No Rol";
    
    tbody.innerHTML += `
      <tr>
        <td>${user.name}</td>
        <td>${user.lastname}</td>
        <td>${user.contact_number}</td>
        <td>${user.email}</td>
        <td>${roleName}</td>
        <td>
          <label class="switch">
            <input type="checkbox" ${user.status === "active" ? "checked" : ""} 
              onchange="updateUserStatus('${user._id}', this.checked ? 'active' : 'inactive')" 
              ${user._id === getCurrentUserId() ? "disabled" : ""}>
            <span class="slider round"></span>
          </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${user._id}')" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteUser('${user._id}')" class="icon-button delete-button" title="Eliminar" 
              ${user._id === getCurrentUserId() ? "disabled" : ""}>
              <i class="material-icons">delete</i>
            </button>
          </div>
        </td>
      </tr>`;
  });

  renderPaginationControls();
};

// Renderizar controles de paginación
const renderPaginationControls = () => {
  const totalPages = Math.ceil(allUsers.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info:nth-child(2)");

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
  const endItem = Math.min(startItem + rowsPerPage - 1, allUsers.length);
  info.innerHTML = `${startItem}-${endItem} de ${allUsers.length}`;
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderUsersTable(currentPage);
};

// ===== FUNCIONES DE UTILIDAD =====

// Obtener el ID del usuario actual
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    // Decodificar el token JWT (solo la parte de payload)
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.id || null;
  } catch (error) {
    return null;
  }
};

// Cargar roles desde el backend
const loadRoles = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return [];
    }

    const res = await fetch(API_ROLES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      let roles = [];
      if (data.roles && Array.isArray(data.roles)) {
        roles = data.roles;
      } else if (Array.isArray(data)) {
        roles = data;
      } else {
        roles = [];
      }
      
      // Cambiar #role por #rol para el selector del formulario de registro
      const roleSelectors = document.querySelectorAll('#rol, #editRole');
      
      roleSelectors.forEach(selector => {
        // Guardar la primera opción (si existe)
        let defaultOption = null;
        if (selector.options.length > 0) {
          defaultOption = selector.options[0];
        }
        
        // Limpiar el selector
        selector.innerHTML = '';
        
        // Restaurar la opción por defecto
        if (defaultOption) {
          selector.appendChild(defaultOption);
        } else {
          // Si no había opción por defecto, crear una
          const option = document.createElement('option');
          option.value = "";
          option.textContent = "Seleccione un rol";
          option.disabled = true;
          option.selected = true;
          selector.appendChild(option);
        }
        
        // Añadir los roles desde la base de datos
        // Solo incluir roles activos
        const activeRoles = roles.filter(role => role.status === "active");
        
        activeRoles.forEach(role => {
          const option = document.createElement('option');
          option.value = role._id;
          const displayName = role.displayName || getDisplayNameForRole(role.name) || role.name;
          option.textContent = displayName;
          selector.appendChild(option);
        });
      });
      
      return roles;
    } else {
      showError(data.message || "Error al cargar roles.");
      return [];
    }
  } catch (err) {
    showError("Error al cargar roles: " + (err.message || "desconocido"));
    return [];
  }
};

// ===== FUNCIONES DE API =====

// Función interna para cargar usuarios sin mostrar indicador de carga
const loadUsersInternal = async () => {
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
      originalUsers = data.users || data;
      
      // Añadir displayName a los roles si no lo tienen
      originalUsers = originalUsers.map(user => {
        if (user.role) {
          if (typeof user.role === 'string') {
            user.role = {
              name: user.role,
              displayName: getDisplayNameForRole(user.role)
            };
          } else if (typeof user.role === 'object' && !user.role.displayName) {
            user.role.displayName = getDisplayNameForRole(user.role.name);
          }
        }
        return user;
      });
      
      allUsers = [...originalUsers];
      currentPage = 1;
      renderUsersTable(currentPage);
    } else {
      showError(data.message || "No tienes permisos para listar usuarios.");
    }
  } catch (err) {
    showError("Error al listar usuarios");
  }
};

// Listar usuarios desde el backend con indicador de carga
const listUsers = async () => {
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
      originalUsers = data.users || data;
      
      // Añadir displayName a los roles si no lo tienen
      originalUsers = originalUsers.map(user => {
        if (user.role) {
          if (typeof user.role === 'string') {
            user.role = {
              name: user.role,
              displayName: getDisplayNameForRole(user.role)
            };
          } else if (typeof user.role === 'object' && !user.role.displayName) {
            user.role.displayName = getDisplayNameForRole(user.role.name);
          }
        }
        return user;
      });
      
      allUsers = [...originalUsers];
      currentPage = 1;
      renderUsersTable(currentPage);
    } else {
      showError(data.message || "No tienes permisos para listar usuarios.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar usuarios");
  }
};

// Registrar usuario
const registerUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const nameValid = validateField("name", "El nombre es obligatorio.");
  const lastnameValid = validateField("lastname", "El apellido es obligatorio.");
  const phoneValid = validatePhone("contact_number");
  const emailValid = validateEmail("email");
  const passwordValid = validatePassword("password");
  const roleValid = validateRole("role");

  if (!nameValid || !lastnameValid || !phoneValid || !emailValid || !passwordValid || !roleValid) {
    return;
  }

  const name = document.getElementById("name").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const contact_number = document.getElementById("contact_number").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("rol").value;

  try {
    const res = await fetch(API_AUTH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name, lastname, email, contact_number, password, role
      })
    });

    const data = await res.json();

    if (res.status === 201 || res.ok) {
      if (data.user && data.user.role) {
        const registeredUser = data.user;
        
        if (typeof registeredUser.role === 'string') {
          const roleName = registeredUser.role;
          registeredUser.role = {
            name: roleName,
            displayName: getDisplayNameForRole(roleName)
          };
        } else if (typeof registeredUser.role === 'object' && !registeredUser.role.displayName) {
          registeredUser.role.displayName = getDisplayNameForRole(registeredUser.role.name);
        }
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Usuario registrado correctamente.`,
        showConfirmButton: true,
      });

      closeModal('registerModal');
      document.getElementById("userForm").reset();
      loadUsersInternal();
    } else {
      showError(data.message || "Error al registrar usuario.");
    }
  } catch (err) {
    showError("Error al registrar usuario");
  }
};

// Llenar formulario de edición con datos del usuario
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");

  try {
    await loadRoles();
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    
    if (!res.ok) {
      showError(data.message || "Error al cargar los datos del usuario.");
      return;
    }

    clearValidationErrors('editForm');

    const user = data;
    document.getElementById("editId").value = user._id || "";
    document.getElementById("editName").value = user.name || "";
    document.getElementById("editLastname").value = user.lastname || "";
    document.getElementById("editContact").value = user.contact_number || "";
    document.getElementById("editEmail").value = user.email || "";

    const roleSelect = document.getElementById("editRole");
    if (roleSelect) {
      if (user.role) {
        const roleId = user.role._id || user.role;
        roleSelect.value = roleId;

        if (roleSelect.value !== roleId) {
          if (typeof user.role === 'object' && user.role.name) {
            const option = document.createElement('option');
            option.value = roleId;
            // Usar displayName si está disponible, sino usar el nombre original
            option.textContent = user.role.displayName || getDisplayNameForRole(user.role.name) || user.role.name;
            roleSelect.appendChild(option);
            roleSelect.value = roleId;
          }
        }
      } else {
        roleSelect.value = "";
      }
    }

    openModal("editModal");
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar usuario
const updateUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const nameValid = validateField("editName", "El nombre es obligatorio.");
  const lastnameValid = validateField("editLastname", "El apellido es obligatorio.");
  const phoneValid = validatePhone("editContact");
  const emailValid = validateEmail("editEmail");
  const roleValid = validateRole("editRole");

  if (!nameValid || !lastnameValid || !phoneValid || !emailValid || !roleValid) {
    return;
  }
  
  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const lastname = document.getElementById("editLastname").value.trim();
  const contact_number = document.getElementById("editContact").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const roleSelect = document.getElementById("editRole");
  
  const userData = { 
    name, lastname, email, contact_number
  };

  if (roleSelect && roleSelect.value) {
    userData.role = roleSelect.value;
  }
    
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      if (data.user && data.user.role) {
        const updatedUser = data.user;
        
        if (typeof updatedUser.role === 'string') {
          const roleName = updatedUser.role;
          updatedUser.role = {
            name: roleName,
            displayName: getDisplayNameForRole(roleName)
          };
        } else if (typeof updatedUser.role === 'object' && !updatedUser.role.displayName) {
          updatedUser.role.displayName = getDisplayNameForRole(updatedUser.role.name);
        }
        
        const userIndex = allUsers.findIndex(u => u._id === id);
        if (userIndex !== -1) {
          allUsers[userIndex] = { ...allUsers[userIndex], ...updatedUser };
          renderUsersTable(currentPage);
        }
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Usuario actualizado correctamente.`,
        showConfirmButton: true,
      });
      closeModal("editModal");
      document.getElementById("editForm").reset();
      loadUsersInternal();
    } else {
      let errorMsg = data.message || `Error al actualizar el usuario (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
    }
  } catch (err) {
    showError(`Ocurrió un error de red: ${err.message || err}`);
  }
};

// Actualizar solo el estado de un usuario
const updateUserStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  if (id === getCurrentUserId() && status === 'inactive') {
    showError("No puedes desactivar tu propia cuenta");
    // Restaurar el switch a posición activa
    const checkbox = document.querySelector(`tr[data-userid="${id}"] input[type="checkbox"]`);
    if (checkbox) checkbox.checked = true;
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
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Usuario ${status === 'active' ? 'activado' : 'desactivado'} correctamente.`,
        showConfirmButton: true,
      });
      loadUsersInternal();
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} el usuario (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
      loadUsersInternal();
    }
  } catch (err) {
    showError(`Ocurrió un error de red: ${err.message || err}`);
    loadUsersInternal();
  }
};

// Eliminar usuario
const deleteUser = async (id) => {
  const token = localStorage.getItem("token");

  if (id === getCurrentUserId()) {
    showError("No puedes eliminar tu propia cuenta");
    return;
  }

  const confirmed = await showConfirm({ 
    title: "¿Estás seguro de eliminar este usuario?", 
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
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Usuario eliminado correctamente.`,
        showConfirmButton: true,
      });
      loadUsersInternal();
    } else {
      showError(data.message || "No se pudo eliminar el usuario");
    }
  } catch (err) {
    showError("Error al eliminar usuario");
  }
};

// Buscar usuario
const searchUser = () => {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  allUsers = term
    ? originalUsers.filter(u => 
        u.name.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term) ||
        u.lastname.toLowerCase().includes(term))
    : [...originalUsers];
  currentPage = 1;
  renderUsersTable(currentPage);
};

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

// Mostrar confirmación
function showConfirm({ title, text, confirmText, cancelText }) {
  return Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  }).then((result) => {
    return result.isConfirmed;
  });
}

// ===== EVENTOS =====

document.addEventListener("DOMContentLoaded", async () => {
  disableNativeBrowserValidation();
  setupPhoneNumberValidation();
  
  // Cargar roles primero para asegurar que los selectores estén poblados
  try {
    await loadRoles();
  } catch (error) {
    // Manejo silencioso del error
  }
  
  // Luego cargar los usuarios
  try {
    await listUsers();
  } catch (error) {
    // Manejo silencioso del error
  }
  
  // Configurar botones y eventos
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = async () => {
      // Recargar roles antes de abrir el modal para asegurar que estén actualizados
      await loadRoles();
      openModal('registerModal');
    };
  }
  
 const addUserButton = document.getElementById("addUserButton");
  if (addUserButton) {
    addUserButton.onclick = async () => {
      await loadRoles();
      openModal('registerModal');
    };
  }
  
  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.onclick = registerUser;
  }
  
  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.onclick = updateUser;
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchUser);
  }

  // Validación para formulario de registro
  document.getElementById("name").addEventListener("blur", () => validateField("name", "El nombre es obligatorio."));
  document.getElementById("lastname").addEventListener("blur", () => validateField("lastname", "El apellido es obligatorio."));
  document.getElementById("contact_number").addEventListener("blur", () => validatePhone("contact_number"));
  document.getElementById("email").addEventListener("blur", () => validateEmail("email"));
  document.getElementById("password").addEventListener("blur", () => validatePassword("password"));
  
  // Usar 'rol' en lugar de 'role' para el selector del formulario de registro
  const rolSelector = document.getElementById("rol");
  if (rolSelector) {
    rolSelector.addEventListener("change", () => validateRole("role"));
  }
  
  // Validación para formulario de edición
  document.getElementById("editName").addEventListener("blur", () => validateField("editName", "El nombre es obligatorio."));
  document.getElementById("editLastname").addEventListener("blur", () => validateField("editLastname", "El apellido es obligatorio."));
  document.getElementById("editContact").addEventListener("blur", () => validatePhone("editContact"));
  document.getElementById("editEmail").addEventListener("blur", () => validateEmail("editEmail"));
  document.getElementById("editRole").addEventListener("change", () => validateRole("editRole"));

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateUser();
    };
  }
});

window.fillEditForm = fillEditForm;
window.deleteUser = deleteUser;
window.updateUserStatus = updateUserStatus;
window.openModal = openModal;
window.closeModal = closeModal;