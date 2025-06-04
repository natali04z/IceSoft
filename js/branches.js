const API_URL = "https://backend-yy4o.onrender.com/api/branches";
  
// Variables globales
let allBranches = [];
let originalBranches = [];
let currentPage = 1;
const rowsPerPage = 10;

// Función para cerrar el indicador de carga
function hideLoadingIndicator() {
  Swal.close();
}

// Función para validar un campo y mostrar error
function validateField(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field || !field.value.trim()) {
    if (errorElement) {
      errorElement.textContent = errorMessage || "El campo es obligatorio.";
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

// ===========================================
// FUNCIONES DE AUTENTICACIÓN
// ===========================================

function getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
}

function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

function handleAuthError(error, response = null) {
    const isAuthError = (response && response.status === 401) ||
        (error.message && (error.message.includes('token') ||
            error.message.includes('401') ||
            error.message.includes('Unauthorized')));

    if (isAuthError) {
        showError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.').then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
        return true;
    }
    return false;
}

// ===========================================
// FUNCIONES DE MODAL
// ===========================================

// Abrir modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
    
    // Resetear mensajes de error al abrir el modal
    if (modalId === 'registerModal') {
      clearValidationErrors('branchForm');
      document.getElementById("branchForm").reset();
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

// ===== FUNCIÓN PRINCIPAL DE RENDERIZADO CON PAGINADO MEJORADO =====
const renderBranchesTable = (page = 1) => {
  const tbody = document.getElementById("branchTableBody");
  
  if (!tbody) {
    console.error("Elemento branchTableBody no encontrado en el DOM");
    return;
  }
  
  tbody.innerHTML = "";

  if (!allBranches || allBranches.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          No hay sucursales disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  // LÓGICA DE PAGINADO: Calcular elementos a mostrar
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const branchesToShow = allBranches.slice(start, end);

  let tableContent = '';

  // Renderizar solo los elementos de la página actual
  branchesToShow.forEach((branch, index) => {
    try {
      const branchId = branch.id || branch._id || "";
      const displayId = branch.id || `Branch${String(index + 1).padStart(2, '0')}`;
      const branchName = branch.name || "Sin nombre";
      const branchLocation = branch.location || "Sin ubicación";
      const branchAddress = branch.address || "Sin dirección";
      const branchPhone = branch.phone || "Sin teléfono";
      const status = branch.status || "inactive";
      
      tableContent += `
        <tr data-id="${branchId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${branchName}</td>
          <td>${branchLocation}</td>
          <td>${branchAddress}</td>
          <td>${branchPhone}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                onchange="updateBranchStatus('${branchId}', this.checked ? 'active' : 'inactive')">
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${branchId}')" class="icon-button edit-button" title="Editar">
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deleteBranch('${branchId}')" class="icon-button delete-button" title="Eliminar">
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="7" class="text-center text-danger">
            Error al renderizar esta sucursal: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  renderPaginationControls(); // Renderizar controles de paginación
};

// ===== FUNCIÓN DE CONTROLES DE PAGINACIÓN MEJORADA =====
const renderPaginationControls = () => {
  if (!allBranches || allBranches.length === 0) {
    return;
  }
  
  // Calcular total de páginas
  const totalPages = Math.ceil(allBranches.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info");
  
  if (!container) return;

  container.innerHTML = "";

  // Botón "Anterior"
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

  // Botón "Siguiente"
  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-nav");
  nextBtn.innerText = "→";
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);

  // Información de paginación (ej: "1-10 de 50")
  if (info) {
    const startItem = allBranches.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allBranches.length);
    info.innerHTML = `${startItem}-${endItem} de ${allBranches.length}`;
  }
};

// ===== FUNCIÓN PARA CAMBIAR DE PÁGINA =====
const changePage = (page) => {
  currentPage = page;
  renderBranchesTable(currentPage);
};

// Cargar sucursales sin indicador de carga (para actualizaciones internas)
const loadBranchesInternal = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const response = await fetch(API_URL, {
      method: "GET",
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // El controller devuelve: { success: true, branches: [...] }
      originalBranches = data.branches || [];
      
      // Verificar si originalBranches es un array válido
      if (!Array.isArray(originalBranches)) {
        originalBranches = [];
      }
      
      allBranches = [...originalBranches];
      currentPage = 1;
      renderBranchesTable(currentPage);
      
      // Mostrar mensaje si no hay sucursales
      const tbody = document.getElementById("branchTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">
              No se encontraron sucursales. Puede que necesite agregar una nueva sucursal o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "No se pudo listar las sucursales.");
    }
  } catch (err) {
    showError("Error al listar las sucursales.");
  }
};

// Listar sucursales con indicador de carga (solo para carga inicial)
const listBranches = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
 
    showLoadingIndicator();
    
    const response = await fetch(API_URL, {
      method: "GET",
      headers: getAuthHeaders()
    });
    
    const data = await response.json();

    hideLoadingIndicator();
    
    if (response.ok) {
      // El controller devuelve: { success: true, branches: [...] }
      originalBranches = data.branches || [];
      
      // Verificar si originalBranches es un array válido
      if (!Array.isArray(originalBranches)) {
        originalBranches = [];
      }
      
      allBranches = [...originalBranches];
      currentPage = 1;
      renderBranchesTable(currentPage);
      
      // Mostrar mensaje si no hay sucursales
      const tbody = document.getElementById("branchTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">
              No se encontraron sucursales. Puede que necesite agregar una nueva sucursal o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "No se pudo listar las sucursales.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar las sucursales.");
  }
};

// Registrar sucursal - COINCIDE EXACTAMENTE CON postBranches del controller
const registerBranch = async () => {
  const token = getAuthToken();
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  // Validar los campos
  const nameValid = validateField("name", "El nombre de la sucursal es obligatorio");
  const locationValid = validateField("location", "La ubicación es obligatoria");
  const addressValid = validateField("address", "La dirección es obligatoria");
  const phoneValid = validateField("phone", "El teléfono es obligatorio");
  
  if (!nameValid || !locationValid || !addressValid || !phoneValid) {
    return;
  }
  
  const name = document.getElementById('name').value.trim();
  const location = document.getElementById('location').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();

  // Validaciones que coinciden con validateBranchData del controller
  if (name.length < 2 || name.length > 100) {
    showError('El nombre debe tener entre 2 y 100 caracteres');
    return;
  }

  if (location.length < 2 || location.length > 100) {
    showError('La ubicación debe tener entre 2 y 100 caracteres');
    return;
  }

  if (address.length < 5 || address.length > 200) {
    showError('La dirección debe tener entre 5 y 200 caracteres');
    return;
  }

  const phoneRegex = /^[+]?[\d\s()-]{10,15}$/;
  if (!phoneRegex.test(phone)) {
    showError('Formato de teléfono inválido. Debe tener entre 10 y 15 dígitos');
    return;
  }

  // Estructura exacta que espera el controller
  const newBranch = {
    name,
    location,
    phone,
    address,
    status: "active" // Status por defecto como en el controller
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newBranch)
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }

      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));

      // Manejo de errores específicos del controller
      if (response.status === 409) {
        showError(errorData.message || 'Ya existe una sucursal con este nombre');
        return;
      }

      if (response.status === 400 && errorData.errors) {
        const errorMessages = Object.values(errorData.errors).join('\n');
        showError('Errores de validación:\n' + errorMessages);
        return;
      }

      throw new Error(errorData.message || 'Error al registrar la sucursal');
    }

    const result = await response.json();
    console.log('Sucursal creada:', result);
    
    // El controller devuelve: { success: true, message: "Branch created successfully", branch: {...} }
    if (result.success) {
      showSuccess(result.message || 'Sucursal registrada correctamente');
      closeModal('registerModal');

      const branchForm = document.getElementById("branchForm");
      if (branchForm) {
        branchForm.reset();
      } else {
        console.warn("Formulario branchForm no encontrado");
      }

      loadBranchesInternal();
    }

  } catch (error) {
    console.error('Error creating branch:', error);
    if (handleAuthError(error)) {
      return;
    }
    showError(error.message);
  }
};

// Llenar formulario de edición - CORREGIDO para manejar ambas estructuras de respuesta
const fillEditForm = async (id) => {
  const token = getAuthToken();
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }
      if (response.status === 404) {
        showError("Sucursal no encontrada");
        return;
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Data received from getBranchesById:', data);
    
    // El controller puede devolver: { success: true, branch: {...} } O directamente el branch
    let branch;
    if (data.success && data.branch) {
      branch = data.branch;
    } else if (data.id || data._id) {
      // Si viene directamente el objeto branch
      branch = data;
    } else {
      showError("Error al cargar los datos de la sucursal.");
      return;
    }

    console.log('Branch to edit:', branch);
    
    // Limpiar errores de validación
    clearValidationErrors('editForm');

    const editIdElement = document.getElementById("editId");
    const editNameElement = document.getElementById("editName");
    const editLocationElement = document.getElementById("editLocation");
    const editAddressElement = document.getElementById("editAddress");
    const editPhoneElement = document.getElementById("editPhone");
    const editStatusElement = document.getElementById("editStatus");
    
    if (editIdElement) editIdElement.value = branch.id || branch._id || "";
    if (editNameElement) editNameElement.value = branch.name || "";
    if (editLocationElement) editLocationElement.value = branch.location || "";
    if (editAddressElement) editAddressElement.value = branch.address || "";
    if (editPhoneElement) editPhoneElement.value = branch.phone || "";
    if (editStatusElement) editStatusElement.checked = branch.status === "active";

    console.log('Form filled with values:', {
      id: editIdElement?.value,
      name: editNameElement?.value,
      location: editLocationElement?.value,
      address: editAddressElement?.value,
      phone: editPhoneElement?.value,
      status: editStatusElement?.checked
    });

    openModal('editModal');
  } catch (err) {
    console.error('Error fetching branch by ID:', err);
    if (!handleAuthError(err)) {
      showError("Error al cargar sucursal.");
    }
  }
};

// Actualizar sucursal - COINCIDE EXACTAMENTE CON updateBranches del controller
const updateBranch = async () => {
  const token = getAuthToken();
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  // Validar los campos
  const nameValid = validateField("editName", "El nombre de la sucursal es obligatorio");
  const locationValid = validateField("editLocation", "La ubicación es obligatoria");
  const addressValid = validateField("editAddress", "La dirección es obligatoria");
  const phoneValid = validateField("editPhone", "El teléfono es obligatorio");
  
  if (!nameValid || !locationValid || !addressValid || !phoneValid) {
    return;
  }

  const editIdElement = document.getElementById("editId");
  const editNameElement = document.getElementById("editName");
  const editLocationElement = document.getElementById("editLocation");
  const editAddressElement = document.getElementById("editAddress");
  const editPhoneElement = document.getElementById("editPhone");
  const editStatusElement = document.getElementById("editStatus");
  
  if (!editIdElement || !editNameElement || !editLocationElement || !editAddressElement || !editPhoneElement) {
    showError("Error en el formulario. No se encontraron los campos requeridos.");
    return;
  }

  const id = editIdElement.value;
  const name = editNameElement.value.trim();
  const location = editLocationElement.value.trim();
  const address = editAddressElement.value.trim();
  const phone = editPhoneElement.value.trim();
  const status = editStatusElement ? (editStatusElement.checked ? 'active' : 'inactive') : 'active';

  // Validaciones que coinciden con validateBranchData del controller
  if (name.length < 2 || name.length > 100) {
    showError('El nombre debe tener entre 2 y 100 caracteres');
    return;
  }

  if (location.length < 2 || location.length > 100) {
    showError('La ubicación debe tener entre 2 y 100 caracteres');
    return;
  }

  if (address.length < 5 || address.length > 200) {
    showError('La dirección debe tener entre 5 y 200 caracteres');
    return;
  }

  const phoneRegex = /^[+]?[\d\s()-]{10,15}$/;
  if (!phoneRegex.test(phone)) {
    showError('Formato de teléfono inválido');
    return;
  }

  // Estructura que espera el controller
  const updateData = {
    name,
    location,
    phone,
    address,
    status
  };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }

      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));

      // Manejo de errores específicos del controller
      if (response.status === 404) {
        showError(errorData.message || 'Sucursal no encontrada');
        return;
      }

      if (response.status === 409) {
        showError(errorData.message || 'Ya existe otra sucursal con este nombre');
        return;
      }

      if (response.status === 400 && errorData.errors) {
        const errorMessages = Object.values(errorData.errors).join('\n');
        showError('Errores de validación:\n' + errorMessages);
        return;
      }

      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Sucursal actualizada exitosamente:', data);
 
    // El controller devuelve: { success: true, message: "Branch updated successfully", branch: {...} }
    if (data.success) {
      showSuccess(data.message || 'La sucursal ha sido actualizada');
      closeModal('editModal');
      
      const editForm = document.getElementById("editForm");
      if (editForm) {
        editForm.reset();
      } else {
        console.warn("Formulario editForm no encontrado");
      }
      
      loadBranchesInternal();
    } else {
      throw new Error('Respuesta inesperada del servidor');
    }
  } catch (err) {
    console.error('Error updating branch:', err);
    if (handleAuthError(err)) {
      return;
    }
    showError("Error al actualizar la sucursal.");
  }
};

// Actualizar estado de sucursal - VERSIÓN ALTERNATIVA usando PUT si PATCH no funciona
const updateBranchStatus = async (id, status) => {
  const token = getAuthToken();
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  try {
    console.log('=== TOGGLE BRANCH STATUS ===');
    console.log('ID:', id, 'Status:', status);

    // Validar que el status sea válido
    if (!status || !["active", "inactive"].includes(status)) {
      throw new Error('Status must be "active" or "inactive"');
    }

    // Buscar la sucursal localmente para verificar
    const branch = allBranches.find(b => (b.id === id) || (b._id === id));
    if (!branch) {
      throw new Error('Sucursal no encontrada en los datos locales');
    }

    console.log('Sucursal encontrada:', branch);

    // PRIMER INTENTO: Usar la ruta /status con PATCH
    let response = await fetch(`${API_URL}/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    // Si no existe la ruta /status, usar PUT con todos los datos
    if (response.status === 404 || response.status === 405) {
      console.log('Ruta /status no disponible, usando PUT con datos completos');
      
      const updateData = {
        name: branch.name,
        location: branch.location,
        phone: branch.phone,
        address: branch.address,
        status: status  // Solo cambiar el status
      };

      response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
    }

    console.log('Response status:', response.status);

    let data;
    try {
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (responseText) {
        data = JSON.parse(responseText);
      } else {
        data = { message: "Respuesta vacía del servidor" };
      }
    } catch (jsonError) {
      console.error("Error al parsear JSON:", jsonError);
      data = { message: "Error en formato de respuesta del servidor" };
    }

    console.log('Parsed data:', data);

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }

      if (response.status === 404) {
        throw new Error(data.message || 'Sucursal no encontrada');
      }

      if (response.status === 400) {
        // Manejo específico para dependencias activas
        if (data.message && data.message.includes('active')) {
          showInfo('No se puede desactivar la sucursal porque tiene elementos activos asociados.');
          loadBranchesInternal();
          return;
        }
        throw new Error(data.message || 'Datos inválidos');
      }

      if (response.status === 409) {
        throw new Error(data.message || 'Conflicto al actualizar');
      }

      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }

    console.log('Status updated successfully:', data);
    
    // Manejar diferentes estructuras de respuesta
    if (data.success || response.status === 200) {
      // Actualizar estado local
      const index = allBranches.findIndex(b => (b.id === id) || (b._id === id));
      if (index !== -1) {
        allBranches[index].status = status;
        renderBranchesTable(currentPage);
      }

      showSuccess(data.message || `La sucursal ha sido ${status === 'active' ? 'activada' : 'desactivada'}`);
    } else {
      throw new Error('Respuesta inesperada del servidor');
    }

  } catch (error) {
    console.error('Error changing branch status:', error);

    if (handleAuthError(error)) {
      return;
    }

    // Revertir el estado en la UI
    renderBranchesTable(currentPage);
    showError(error.message || 'No se pudo actualizar el estado de la sucursal');
  }
};

// Eliminar sucursal - COINCIDE EXACTAMENTE CON deleteBranches del controller
const deleteBranch = async (id) => {
  const token = getAuthToken();
  
  // Confirmar antes de eliminar
  const confirmed = await showConfirm({ 
    title: "¿Estás seguro de eliminar esta sucursal?", 
    text: "Esta acción no se puede deshacer.", 
    confirmText: "Eliminar", 
    cancelText: "Cancelar" 
  });

  if (!confirmed) return;
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }

      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));

      if (response.status === 404) {
        showError(errorData.message || 'Sucursal no encontrada');
        return;
      }

      throw new Error(errorData.message || 'Error al eliminar la sucursal');
    }
    
    const data = await response.json();
    console.log('Sucursal eliminada:', data);
    
    // El controller devuelve: { success: true, message: "Branch deleted successfully" }
    if (data.success) {
      showSuccess(data.message || 'La sucursal ha sido eliminada');
      loadBranchesInternal();
    }
  } catch (err) {
    console.error('Error deleting branch:', err);
    if (handleAuthError(err)) {
      return;
    }
    showError("Error al eliminar la sucursal.");
  }
};

// ===== FUNCIÓN DE BÚSQUEDA CON PAGINADO =====
const searchBranch = () => {
  const searchInput = document.getElementById("searchInput");
  
  if (!searchInput) {
    console.error("Elemento searchInput no encontrado");
    return;
  }
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalBranches) {
    console.error("Array originalBranches no inicializado");
    return;
  }
  
  if (!term) {
    allBranches = [...originalBranches];
  } else {
    // Filtrar sucursales según el término de búsqueda
    allBranches = originalBranches.filter(branch => {
      const nameMatch = branch.name && branch.name.toLowerCase().includes(term);
      const locationMatch = branch.location && branch.location.toLowerCase().includes(term);
      const addressMatch = branch.address && branch.address.toLowerCase().includes(term);
      const phoneMatch = branch.phone && branch.phone.includes(term);
      const idMatch = branch.id && branch.id.toLowerCase().includes(term);
      
      return nameMatch || locationMatch || addressMatch || phoneMatch || idMatch;
    });
  }
  
  // Resetear a la primera página después de una búsqueda
  currentPage = 1;
  renderBranchesTable(currentPage);
};

// Funciones de paginación
function nextPage() {
    const totalPages = Math.ceil(allBranches.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderBranchesTable(currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderBranchesTable(currentPage);
    }
}

function goToPage(page) {
    const totalPages = Math.ceil(allBranches.length / rowsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderBranchesTable(currentPage);
    }
}

// ===========================================
// INICIALIZACIÓN
// ===========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM cargado, iniciando verificaciones...');

    // Verificar token
    const token = getAuthToken();
    if (!token) {
        showError('Debe iniciar sesión para acceder a esta página').then(() => {
            window.location.href = 'index.html';
        });
        return;
    }

    console.log('Token encontrado, cargando sucursales...');

    // Cargar sucursales
    try {
        await listBranches(); // Esta es la única que usa el indicador de carga
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
        registerButton.onclick = registerBranch;
    } else {
        console.warn("Elemento registerButton no encontrado");
    }
    
    const editButton = document.getElementById("editButton");
    if (editButton) {
        editButton.onclick = updateBranch;
    } else {
        console.warn("Elemento editButton no encontrado");
    }
    
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", searchBranch);
    } else {
        console.warn("Elemento searchInput no encontrado");
    }

    // Agregar validación en tiempo real para los campos
    const nameInput = document.getElementById("name");
    if (nameInput) {
        nameInput.addEventListener("blur", () => validateField("name", "El nombre de la sucursal es obligatorio"));
    }
    
    const locationInput = document.getElementById("location");
    if (locationInput) {
        locationInput.addEventListener("blur", () => validateField("location", "La ubicación es obligatoria"));
    }
    
    const addressInput = document.getElementById("address");
    if (addressInput) {
        addressInput.addEventListener("blur", () => validateField("address", "La dirección es obligatoria"));
    }
    
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("blur", () => validateField("phone", "El teléfono es obligatorio"));
    }
    
    const editNameInput = document.getElementById("editName");
    if (editNameInput) {
        editNameInput.addEventListener("blur", () => validateField("editName", "El nombre de la sucursal es obligatorio"));
    }
    
    const editLocationInput = document.getElementById("editLocation");
    if (editLocationInput) {
        editLocationInput.addEventListener("blur", () => validateField("editLocation", "La ubicación es obligatoria"));
    }
    
    const editAddressInput = document.getElementById("editAddress");
    if (editAddressInput) {
        editAddressInput.addEventListener("blur", () => validateField("editAddress", "La dirección es obligatoria"));
    }
    
    const editPhoneInput = document.getElementById("editPhone");
    if (editPhoneInput) {
        editPhoneInput.addEventListener("blur", () => validateField("editPhone", "El teléfono es obligatorio"));
    }

    const editForm = document.getElementById("editForm");
    if (editForm) {
        editForm.onsubmit = async (event) => {
            event.preventDefault();
            await updateBranch();
        };
    } else {
        console.warn("Elemento editForm no encontrado");
    }
    
    // Código CSS para mensajes de error
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .error-message {
            color: #e74c3c;
            font-size: 12px;
            margin-top: 5px;
            display: none;
        }
        
        .input-error {
            border-color: #e74c3c !important;
        }
    `;
    document.head.appendChild(styleElement);

    // Event listeners para cerrar modales
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

// Exportar funciones globales
window.fillEditForm = fillEditForm;
window.updateBranchStatus = updateBranchStatus;
window.deleteBranch = deleteBranch;
window.openModal = openModal;
window.closeModal = closeModal;
window.changePage = changePage;
window.updateBranch = updateBranch;