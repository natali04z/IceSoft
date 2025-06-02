const API_URL = "https://backend-yy4o.onrender.com/api/categories";
  
// Variables globales
let allCategories = [];
let originalCategories = [];
let currentPage = 1;
const rowsPerPage = 10;

// Obtener permisos de usuario
function getUserPermissions() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return ['edit_categories', 'delete_categories'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['edit_categories', 'delete_categories'];
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return ['edit_categories', 'delete_categories'];
  }
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

// Abrir modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
    
    // Resetear mensajes de error al abrir el modal
    if (modalId === 'registerModal') {
      clearValidationErrors('categoryForm');
      document.getElementById("categoryForm").reset();
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
const renderCategoriesTable = (page = 1) => {
  const tbody = document.getElementById("categoryTableBody");
  
  if (!tbody) {
    console.error("Elemento categoryTableBody no encontrado en el DOM");
    return;
  }
  
  tbody.innerHTML = "";

  if (!allCategories || allCategories.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          No hay categorías disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  // LÓGICA DE PAGINADO: Calcular elementos a mostrar
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const categoriesToShow = allCategories.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditCategories = userPermissions.includes("edit_categories");
  
  let tableContent = '';

  // Renderizar solo los elementos de la página actual
  categoriesToShow.forEach((category, index) => {
    try {
      const categoryId = category._id || "";
      const displayId = category.id || categoryId || `Cat${String(index + 1).padStart(2, '0')}`;
      const categoryName = category.name || "Sin nombre";
      const status = category.status || "inactive";
      
      tableContent += `
        <tr data-id="${categoryId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${categoryName}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                ${canEditCategories ? `onchange="updateCategoryStatus('${categoryId}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${categoryId}')" class="icon-button edit-button" title="Editar" ${canEditCategories ? '' : 'disabled'}>
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deleteCategory('${categoryId}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_categories") ? '' : 'disabled'}>
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="4" class="text-center text-danger">
            Error al renderizar esta categoría: ${error.message}
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
  if (!allCategories || allCategories.length === 0) {
    return;
  }
  
  // Calcular total de páginas
  const totalPages = Math.ceil(allCategories.length / rowsPerPage);
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
    const startItem = allCategories.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allCategories.length);
    info.innerHTML = `${startItem}-${endItem} de ${allCategories.length}`;
  }
};

// ===== FUNCIÓN PARA CAMBIAR DE PÁGINA =====
const changePage = (page) => {
  currentPage = page;
  renderCategoriesTable(currentPage);
};

// Cargar categorías sin indicador de carga (para actualizaciones internas)
const loadCategoriesInternal = async () => {
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
      originalCategories = data.categories || data;
      
      // Verificar si originalCategories es un array válido
      if (!Array.isArray(originalCategories)) {
        originalCategories = [];
      }
      
      allCategories = [...originalCategories];
      currentPage = 1;
      renderCategoriesTable(currentPage);
      
      // Mostrar mensaje si no hay categorías
      const tbody = document.getElementById("categoryTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center">
              No se encontraron categorías. Puede que necesite agregar una nueva categoría o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "No se pudo listar las categorías.");
    }
  } catch (err) {
    showError("Error al listar las categorías.");
  }
};

// Listar categorías con indicador de carga (solo para carga inicial)
const listCategories = async () => {
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
      originalCategories = data.categories || data;
      
      // Verificar si originalCategories es un array válido
      if (!Array.isArray(originalCategories)) {
        originalCategories = [];
      }
      
      allCategories = [...originalCategories];
      currentPage = 1;
      renderCategoriesTable(currentPage);
      
      // Mostrar mensaje si no hay categorías
      const tbody = document.getElementById("categoryTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center">
              No se encontraron categorías. Puede que necesite agregar una nueva categoría o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "No se pudo listar las categorías.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar las categorías.");
  }
};

// Registrar categoría
const registerCategory = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  // Validar el campo nombre
  const nameValid = validateField("name", "El nombre de la categoría es obligatorio");
  
  if (!nameValid) {
    return;
  }
  
  const name = document.getElementById("name").value.trim();

  try { 
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    
    const data = await res.json();
    
    if (res.status === 201 || res.ok) {
      showSuccess('La categoría ha sido registrada');
      closeModal('registerModal');
      
      const categoryForm = document.getElementById("categoryForm");
      if (categoryForm) {
        categoryForm.reset();
      } else {
        console.warn("Formulario categoryForm no encontrado");
      }
      
      loadCategoriesInternal();
    } else {
      showError(data.message || "No se pudo registrar la categoría.");
    }
  } catch (err) {
    showError("Error al registrar la categoría.");
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
      showError(data.message || "Error al cargar los datos de la categoría.");
      return;
    }

    const category = await res.json();
    
    // Limpiar errores de validación
    clearValidationErrors('editForm');

    const editIdElement = document.getElementById("editId");
    const editNameElement = document.getElementById("editName");
    const editStatusElement = document.getElementById("editStatus");
    
    if (editIdElement) editIdElement.value = category._id;
    if (editNameElement) editNameElement.value = category.name || "";
    if (editStatusElement) editStatusElement.checked = category.status === "active";

    openModal('editModal');
  } catch (err) {
    showError("Error al cargar categoría.");
  }
};

// Actualizar categoría
const updateCategory = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  // Validar el campo nombre
  const nameValid = validateField("editName", "El nombre de la categoría es obligatorio");
  
  if (!nameValid) {
    return;
  }

  const editIdElement = document.getElementById("editId");
  const editNameElement = document.getElementById("editName");
  
  if (!editIdElement || !editNameElement) {
    showError("Error en el formulario. No se encontraron los campos requeridos.");
    return;
  }

  const id = editIdElement.value;
  const name = editNameElement.value.trim();

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
 
    if (res.ok) {
      showSuccess('La categoría ha sido actualizada');
      closeModal('editModal');
      
      const editForm = document.getElementById("editForm");
      if (editForm) {
        editForm.reset();
      } else {
        console.warn("Formulario editForm no encontrado");
      }
      
      loadCategoriesInternal();
    } else {
      showError(data.message || "No se pudo actualizar la categoría.");
    }
  } catch (err) {
    showError("Error al actualizar la categoría.");
  }
};

// Actualizar estado de categoría
const updateCategoryStatus = async (id, status) => {
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
      showSuccess(`La categoría ha sido ${status === 'active' ? 'activada' : 'desactivada'}`);
      loadCategoriesInternal();
    } else {
      let errorMsg = data.message || `No se pudo ${status === 'active' ? 'activar' : 'desactivar'} la categoría.`;
      
      if (res.status === 400 && data.message && data.message.includes('active products associated')) {
        showInfo('No se puede desactivar la categoría porque tiene productos activos asociados.');
      } else {
        if (data.error) {
          errorMsg += ` ${data.error}`;
        }
        showError(errorMsg);
      }

      console.error("Error response:", {
        status: res.status,
        data: data
      });
      loadCategoriesInternal();
    }
  } catch (err) {
    showError("Error al actualizar estado de la categoría.");
    loadCategoriesInternal();
  }
};

// Eliminar categoría
const deleteCategory = async (id) => {
  const token = localStorage.getItem("token");
  
  // Confirmar antes de eliminar
  const confirmed = await showConfirm({ 
    title: "¿Estás seguro de eliminar esta categoría?", 
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
      showSuccess('La categoría ha sido eliminada');
      loadCategoriesInternal();
    } else {
      showError(data.message || "No se pudo eliminar la categoría.");
    }
  } catch (err) {
    showError("Error al eliminar la categoría.");
  }
};

// ===== FUNCIÓN DE BÚSQUEDA CON PAGINADO =====
const searchCategory = () => {
  const searchInput = document.getElementById("searchInput");
  
  if (!searchInput) {
    console.error("Elemento searchInput no encontrado");
    return;
  }
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalCategories) {
    console.error("Array originalCategories no inicializado");
    return;
  }
  
  if (!term) {
    allCategories = [...originalCategories];
  } else {
    // Filtrar categorías según el término de búsqueda
    allCategories = originalCategories.filter(category => {
      const nameMatch = category.name && category.name.toLowerCase().includes(term);
      const idMatch = category.id && category.id.toLowerCase().includes(term);
      
      return nameMatch || idMatch;
    });
  }
  
  // Resetear a la primera página después de una búsqueda
  currentPage = 1;
  renderCategoriesTable(currentPage);
};

// Función para cerrar el indicador de carga
function hideLoadingIndicator() {
  Swal.close();
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  const categoryTableBody = document.getElementById("categoryTableBody");
  if (!categoryTableBody) {
    console.error("ELEMENTO CRÍTICO NO ENCONTRADO: categoryTableBody");
  }
 
  try {
    listCategories(); // Esta es la única que usa el indicador de carga
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
    registerButton.onclick = registerCategory;
  } else {
    console.warn("Elemento registerButton no encontrado");
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchCategory);
  } else {
    console.warn("Elemento searchInput no encontrado");
  }

  // Agregar validación en tiempo real para los campos
  const nameInput = document.getElementById("name");
  if (nameInput) {
    nameInput.addEventListener("blur", () => validateField("name", "El nombre de la categoría es obligatorio"));
  }
  
  const editNameInput = document.getElementById("editName");
  if (editNameInput) {
    editNameInput.addEventListener("blur", () => validateField("editName", "El nombre de la categoría es obligatorio"));
  }

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateCategory();
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
});

// Exportar funciones globales
window.fillEditForm = fillEditForm;
window.updateCategoryStatus = updateCategoryStatus;
window.deleteCategory = deleteCategory;
window.openModal = openModal;
window.closeModal = closeModal;
window.changePage = changePage;