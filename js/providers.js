// ===== CONFIGURACIÓN Y VARIABLES GLOBALES =====

// Endpoints de la API
const API_PROVIDERS = "https://backend-alpha-orpin-58.vercel.app/api/providers";

// Variables globales para proveedores y paginación
let allProviders = [];
let originalProviders = [];
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

// Función para validar número NIT
function validateNIT(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El NIT es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!/^[\d-]+$/.test(field.value.trim())) {
    errorElement.textContent = "El NIT debe contener solo dígitos y guiones.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (field.value.trim().replace(/-/g, '').length < 9) {
    errorElement.textContent = "El NIT debe tener al menos 9 dígitos.";
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
  } else if (field.value.trim().length < 10) {
    errorElement.textContent = "El teléfono debe tener al menos 10 dígitos.";
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

// Función para validar nombre empresa
function validateCompany(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El nombre de la empresa es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (field.value.trim().length < 2 || field.value.trim().length > 100) {
    errorElement.textContent = "El nombre de la empresa debe tener entre 2 y 100 caracteres.";
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

// Función para establecer validación de campos numéricos
function setupNumericValidation() {
  const phoneInputs = document.querySelectorAll('#contact_phone, #editContactPhone');
  const nitInputs = document.querySelectorAll('#nit, #editNit');
  
  // Validación para teléfonos (solo números)
  phoneInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    input.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '');
    });
  });
  
  // Validación para NIT (números y guiones)
  nitInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (!/^[\d-]$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    input.addEventListener('input', function() {
      this.value = this.value.replace(/[^\d-]/g, '');
    });
  });
}

function disableNativeBrowserValidation() {
  const providerForm = document.getElementById("providerForm");
  if (providerForm) {
    providerForm.setAttribute("novalidate", "");
    const inputs = providerForm.querySelectorAll("input");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
      input.removeAttribute("minlength");
    });
  }

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.setAttribute("novalidate", "");
    const inputs = editForm.querySelectorAll("input");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
      input.removeAttribute("minlength");
    });
  }
}

// ===== FUNCIONES DE UTILIDAD =====

// Función para obtener permisos de usuario
function getUserPermissions() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return ['update_providers', 'delete_providers', 'update_status_providers'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['update_providers', 'delete_providers', 'update_status_providers'];
  } catch (error) {
    return ['update_providers', 'delete_providers', 'update_status_providers'];
  }
}

// Función para abrir un modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
    
    if (modalId === 'registerModal') {
      clearValidationErrors('providerForm');
      document.getElementById("providerForm").reset();
    } else if (modalId === 'editModal') {
      clearValidationErrors('editForm');
    }
  }
}

// Función para cerrar un modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

function hideLoadingIndicator() {
  Swal.close();
}

// Función para agregar espacio extra a la columna del NIT
function addSpaceToNitColumn() {
  const nitCells = document.querySelectorAll('#providerTableBody tr td:nth-child(2)');
  nitCells.forEach(cell => {
    cell.style.padding = '30x 22px';
  });
}

// ===== FUNCIONES DE RENDERIZADO Y PAGINACIÓN =====

// Función principal de renderizado con paginado
const renderProvidersTable = (page = 1) => {
  const tbody = document.getElementById("providerTableBody");
  
  if (!tbody) {
    return;
  }
  
  tbody.innerHTML = "";

  if (!allProviders || allProviders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center">
          No hay proveedores disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const providersToShow = allProviders.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditProviders = userPermissions.includes("update_providers");
  const canUpdateStatus = userPermissions.includes("update_status_providers");
  
  let tableContent = '';

  providersToShow.forEach((provider, index) => {
    try {
      const providerId = provider._id || "";
      const displayId = provider.id || providerId || `Prov${String(index + 1).padStart(2, '0')}`;
      const providerNit = provider.nit || "Sin NIT";
      const providerCompany = provider.company || "Sin empresa";
      const providerName = provider.name || "Sin nombre";
      const providerPhone = provider.contact_phone || "Sin teléfono";
      const providerEmail = provider.email || "Sin email";
      const status = provider.status || "inactive";
      
      tableContent += `
        <tr data-id="${providerId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${providerNit}</td>
          <td>${providerCompany}</td>
          <td>${providerName}</td>
          <td>${providerPhone}</td>
          <td>${providerEmail}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                onclick="updateProviderStatus('${providerId}', this.checked ? 'active' : 'inactive')" 
                ${canUpdateStatus ? '' : 'disabled'}>
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${providerId}')" class="icon-button edit-button" title="Editar" ${canEditProviders ? '' : 'disabled'}>
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deleteProvider('${providerId}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_providers") ? '' : 'disabled'}>
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="8" class="text-center text-danger">
            Error al renderizar este proveedor: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  
  // Agregar espacio extra a la columna del NIT después de renderizar
  addSpaceToNitColumn();
  
  renderPaginationControls();
};

// Función de controles de paginación
const renderPaginationControls = () => {
  if (!allProviders || allProviders.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allProviders.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info");

  if (!container) return;

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
    const startItem = allProviders.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allProviders.length);
    info.innerHTML = `${startItem}-${endItem} de ${allProviders.length}`;
  }
};

// Función para cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderProvidersTable(currentPage);
};

// ===== FUNCIONES DE CARGA DE DATOS =====

// Cargar proveedores internamente sin indicador de carga
const loadProvidersInternal = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_PROVIDERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      try {
        const errorData = await res.json();
        showError(errorData.message || `Error del servidor: ${res.status} ${res.statusText}`);
      } catch (parseError) {
        showError(`Error del servidor: ${res.status} ${res.statusText}`);
      }
      return;
    }
    
    const data = await res.json();
    
    if (data.success) {
      originalProviders = data.data || [];
    } else if (Array.isArray(data)) {
      originalProviders = data;
    } else {
      originalProviders = [];
    }
    
    if (!Array.isArray(originalProviders)) {
      originalProviders = [];
    }
    
    allProviders = [...originalProviders];
    currentPage = 1;
    renderProvidersTable(currentPage);
    
    const tbody = document.getElementById("providerTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">
            No se encontraron proveedores. Puede que necesite agregar un nuevo proveedor o revisar su conexión.
          </td>
        </tr>
      `;
    }
    
  } catch (err) {
    showError("Error de conexión al cargar los proveedores.");
  }
};

// Listar proveedores desde el backend con indicador de carga
const listProviders = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }

    showLoadingIndicator();

    const res = await fetch(API_PROVIDERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      hideLoadingIndicator();
      
      try {
        const errorData = await res.json();
        showError(errorData.message || `Error del servidor: ${res.status} ${res.statusText}`);
      } catch (parseError) {
        showError(`Error del servidor: ${res.status} ${res.statusText}`);
      }
      return;
    }
    
    const data = await res.json();
    hideLoadingIndicator();

    if (data.success) {
      originalProviders = data.data || [];
    } else if (Array.isArray(data)) {
      originalProviders = data;
    } else {
      originalProviders = [];
    }
    
    if (!Array.isArray(originalProviders)) {
      originalProviders = [];
    }
    
    allProviders = [...originalProviders];
    currentPage = 1;
    renderProvidersTable(currentPage);
    
    const tbody = document.getElementById("providerTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">
            No se encontraron proveedores. Puede que necesite agregar un nuevo proveedor o revisar su conexión.
          </td>
        </tr>
      `;
    }
    
  } catch (err) {
    hideLoadingIndicator();
    showError("Error de conexión al servidor. Verifique su conexión a internet.");
  }
};

// ===== FUNCIONES CRUD =====

// Registrar proveedor
const registerProvider = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const nitValid = validateNIT("nit");
  const companyValid = validateCompany("company");
  const nameValid = validateField("name", "El nombre del contacto es obligatorio.");
  const phoneValid = validatePhone("contact_phone");
  const emailValid = validateEmail("email");

  if (!nitValid || !companyValid || !nameValid || !phoneValid || !emailValid) {
    return;
  }
  
  const nitElement = document.getElementById("nit");
  const companyElement = document.getElementById("company");
  const nameElement = document.getElementById("name");
  const contactPhoneElement = document.getElementById("contact_phone");
  const emailElement = document.getElementById("email");
  
  if (!nitElement || !companyElement || !nameElement || !contactPhoneElement || !emailElement) {
    showError("No se encontraron los campos del formulario");
    return;
  }
  
  const nit = nitElement.value.trim();
  const company = companyElement.value.trim();
  const name = nameElement.value.trim();
  const contact_phone = contactPhoneElement.value.trim();
  const email = emailElement.value.trim();

  try {
    const res = await fetch(API_PROVIDERS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        nit, 
        company, 
        name, 
        contact_phone, 
        email 
      })
    });
    
    const data = await res.json();
    
    if (res.status === 201 || res.ok) {
      showSuccess('El proveedor ha sido registrado');
      closeModal('registerModal');

      const providerForm = document.getElementById("providerForm");
      if (providerForm) {
        providerForm.reset();
      }
 
      loadProvidersInternal();
    } else {
      showError(data.message || "No se pudo registrar el proveedor.");
    }
  } catch (err) {
    showError("Error al registrar el proveedor.");
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
    showLoadingIndicator();
    
    const res = await fetch(`${API_PROVIDERS}/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    hideLoadingIndicator();
    
    if (!res.ok) {
      const errorData = await res.json();
      showError(errorData.message || `Error del servidor: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();

    // Verificar la estructura de la respuesta y extraer los datos del proveedor
    let providerData;
    
    if (data.success && data.data) {
      providerData = data.data;
    } else if (data.provider) {
      providerData = data.provider;
    } else if (data._id || data.id) {
      providerData = data;
    } else {
      showError("Error: Formato de datos del proveedor no reconocido.");
      return;
    }

    if (!providerData) {
      showError("No se pudieron cargar los datos del proveedor.");
      return;
    }

    const editIdElement = document.getElementById("editId");
    const editNitElement = document.getElementById("editNit");
    const editCompanyElement = document.getElementById("editCompany");
    const editNameElement = document.getElementById("editName");
    const editContactPhoneElement = document.getElementById("editContactPhone");
    const editEmailElement = document.getElementById("editEmail");
    
    if (!editIdElement || !editNitElement || !editCompanyElement || 
        !editNameElement || !editContactPhoneElement || !editEmailElement) {
      showError("No se encontraron los campos del formulario de edición");
      return;
    }

    clearValidationErrors('editForm');

    editIdElement.value = providerData._id || providerData.id || "";
    editNitElement.value = providerData.nit || "";
    editCompanyElement.value = providerData.company || "";
    editNameElement.value = providerData.name || "";
    editContactPhoneElement.value = providerData.contact_phone || "";
    editEmailElement.value = providerData.email || "";

    openModal("editModal");
    
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al cargar el proveedor: " + (err.message || err));
  }
};

// Actualizar proveedor
const updateProvider = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const nitValid = validateNIT("editNit");
  const companyValid = validateCompany("editCompany");
  const nameValid = validateField("editName", "El nombre del contacto es obligatorio.");
  const phoneValid = validatePhone("editContactPhone");
  const emailValid = validateEmail("editEmail");

  if (!nitValid || !companyValid || !nameValid || !phoneValid || !emailValid) {
    return;
  }

  const editIdElement = document.getElementById("editId");
  const editNitElement = document.getElementById("editNit");
  const editCompanyElement = document.getElementById("editCompany");
  const editNameElement = document.getElementById("editName");
  const editContactPhoneElement = document.getElementById("editContactPhone");
  const editEmailElement = document.getElementById("editEmail");
  
  if (!editIdElement || !editNitElement || !editCompanyElement || 
    !editNameElement || !editContactPhoneElement || !editEmailElement) {
    showError("No se encontraron los campos del formulario de edición");
    return;
  }

  const id = editIdElement.value;
  const nit = editNitElement.value.trim();
  const company = editCompanyElement.value.trim();
  const name = editNameElement.value.trim();
  const contact_phone = editContactPhoneElement.value.trim();
  const email = editEmailElement.value.trim();

  try {
    const res = await fetch(`${API_PROVIDERS}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        nit, 
        company, 
        name, 
        contact_phone, 
        email
      })
    });

    const data = await res.json();

    if (res.ok) {
      showSuccess('El proveedor ha sido actualizado');
      closeModal("editModal");
      
      const editForm = document.getElementById("editForm");
      if (editForm) {
        editForm.reset();
      }

      loadProvidersInternal();
    } else {
      showError(data.message || "No se pudo actualizar el proveedor.");
    }
  } catch (err) {
    showError("Error al actualizar el proveedor.");
  }
};

// Actualizar status del proveedor
const updateProviderStatus = async (id, status) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(`${API_PROVIDERS}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      showSuccess(`El proveedor ha sido ${status === 'active' ? 'activado' : 'desactivado'}`);
      loadProvidersInternal();
    } else {
      const data = await res.json();
      showError(data.message || "No se pudo actualizar el estado del proveedor.");
      loadProvidersInternal();
    }
  } catch (err) {
    showError("Error al actualizar estado del proveedor");
    loadProvidersInternal();
  }
};

// Eliminar proveedor 
const deleteProvider = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar este proveedor?",
    text: "Esta acción no se puede deshacer.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });

  if (!confirmed) return;

  try {
    const res = await fetch(`${API_PROVIDERS}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      showSuccess('El proveedor ha sido eliminado');
      loadProvidersInternal();
    } else {
      showError(data.message || "No se pudo eliminar el proveedor");
    }
  } catch (err) {
    showError("Error al eliminar proveedor");
  }
};

// ===== FUNCIÓN DE BÚSQUEDA =====

const searchProvider = () => {
  const searchInput = document.getElementById("searchInput");

  if (!searchInput) {
    return;
  }

  const term = searchInput.value.toLowerCase().trim();

  if (!originalProviders) {
    return;
  }

  if (!term) {
    allProviders = [...originalProviders];
  } else {
    allProviders = originalProviders.filter(provider => {
      const nameMatch = provider.name && provider.name.toLowerCase().includes(term);
      const emailMatch = provider.email && provider.email.toLowerCase().includes(term);
      const companyMatch = provider.company && provider.company.toLowerCase().includes(term);
      const nitMatch = provider.nit && provider.nit.toLowerCase().includes(term);
      const phoneMatch = provider.contact_phone && provider.contact_phone.includes(term);
      const idMatch = provider.id && provider.id.toLowerCase().includes(term);
      
      return nameMatch || emailMatch || companyMatch || nitMatch || phoneMatch || idMatch;
    });
  }

  currentPage = 1;
  renderProvidersTable(currentPage);
};

// ===== INICIALIZACIÓN Y EVENTOS =====

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  disableNativeBrowserValidation();
  listProviders();
  setupNumericValidation();

  // Configurar botones principales
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
  }

  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.onclick = registerProvider;
  }

  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.onclick = updateProvider;
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchProvider);
  }

  // Validación para formulario de registro
  const nit = document.getElementById("nit");
  if (nit) {
    nit.addEventListener("blur", () => validateNIT("nit"));
  }

  const company = document.getElementById("company");
  if (company) {
    company.addEventListener("blur", () => validateCompany("company"));
  }

  const name = document.getElementById("name");
  if (name) {
    name.addEventListener("blur", () => validateField("name", "El nombre del contacto es obligatorio."));
  }

  const contact_phone = document.getElementById("contact_phone");
  if (contact_phone) {
    contact_phone.addEventListener("blur", () => validatePhone("contact_phone"));
  }

  const email = document.getElementById("email");
  if (email) {
    email.addEventListener("blur", () => validateEmail("email"));
  }

  // Validación para formulario de edición
  const editNit = document.getElementById("editNit");
  if (editNit) {
    editNit.addEventListener("blur", () => validateNIT("editNit"));
  }

  const editCompany = document.getElementById("editCompany");
  if (editCompany) {
    editCompany.addEventListener("blur", () => validateCompany("editCompany"));
  }

  const editName = document.getElementById("editName");
  if (editName) {
    editName.addEventListener("blur", () => validateField("editName", "El nombre del contacto es obligatorio."));
  }

  const editContactPhone = document.getElementById("editContactPhone");
  if (editContactPhone) {
    editContactPhone.addEventListener("blur", () => validatePhone("editContactPhone"));
  }

  const editEmail = document.getElementById("editEmail");
  if (editEmail) {
    editEmail.addEventListener("blur", () => validateEmail("editEmail"));
  }

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateProvider();
    };
  }
});

// ===== FUNCIONES GLOBALES =====

// Hacer funciones globales disponibles
window.fillEditForm = fillEditForm;
window.updateProviderStatus = updateProviderStatus;
window.deleteProvider = deleteProvider;
window.openModal = openModal;
window.closeModal = closeModal;
window.changePage = changePage;