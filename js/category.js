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


// Abrir modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
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
    formTitle.textContent = "Registrar Categoría";
  }
  
  window.scrollTo(0, document.body.scrollHeight);
};

// Ocultar formulario de registro
const hideRegisterForm = () => {
  const registerFormSection = document.getElementById("registerFormSection");
  const categoryForm = document.getElementById("categoryForm");
  
  if (registerFormSection) {
    registerFormSection.style.display = "none";
  }
  
  if (categoryForm) {
    categoryForm.reset();
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

// Renderizar tabla de categorías
const renderCategoriesTable = (page = 1) => {
  const tbody = document.getElementById("categoryTableBody");
  
  if (!tbody) {
    console.error("Elemento categoryTableBody no encontrado en el DOM");
    return;
  }
  
  tbody.innerHTML = "";

  if (!allCategories || allCategories.length === 0) {
    console.warn("No hay categorías para mostrar");
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">No hay categorías disponibles</td></tr>`;
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const categoriesToShow = allCategories.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditCategories = userPermissions.includes("edit_categories");

  categoriesToShow.forEach(category => {
    tbody.innerHTML += `
      <tr>
        <td>${category.id || ''}</td>
        <td>${category.name || ''}</td>
        <td>
          <label class="switch">
            <input type="checkbox" ${category.status === "active" ? "checked" : ""} 
              ${canEditCategories ? `onchange="updateCategoryStatus('${category._id}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
            <span class="slider round"></span>
          </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${category._id}')" class="icon-button edit-button" title="Editar" ${canEditCategories ? '' : 'disabled'}>
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteCategory('${category._id}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_categories") ? '' : 'disabled'}>
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
  if (!allCategories || allCategories.length === 0) {
    console.warn("No hay categorías para paginar");
    return;
  }
  
  const totalPages = Math.ceil(allCategories.length / rowsPerPage);
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
  const endItem = Math.min(startItem + rowsPerPage - 1, allCategories.length);
  info.innerHTML = `${startItem}-${endItem} de ${allCategories.length}`;
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderCategoriesTable(currentPage);
};

const loadCategoriesInternal = async () => {
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
      originalCategories = data.categories || data;

      if (originalCategories.length > 0) {
      }
      
      allCategories = [...originalCategories];
      currentPage = 1;
      renderCategoriesTable(currentPage);
    } else {
      showError(data.message || "Error al listar categorías.");
    }
  } catch (err) {
    console.error("Error al listar categorías:", err);
    showError("Error al listar categorías: " + (err.message || err));
  }
};

// Listar categorías con indicador de carga (solo para carga inicial)
const listCategories = async () => {
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
      originalCategories = data.categories || data;

      if (originalCategories.length > 0) {
      }
      
      allCategories = [...originalCategories];
      currentPage = 1;
      renderCategoriesTable(currentPage);
    } else {
      showError(data.message || "Error al listar categorías.");
    }
  } catch (err) {
    hideLoadingIndicator();
    console.error("Error al listar categorías:", err);
    showError("Error al listar categorías: " + (err.message || err));
  }
};

// Registrar categoría
const registerCategory = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const nameElement = document.getElementById("name");
  
  if (!nameElement) {
    showError("No se encontró el campo de nombre");
    return;
  }
  
  const name = nameElement.value.trim();

  if (!name) {
    showValidation("El nombre es obligatorio.");
    return;
  }

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
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Categoría registrada correctamente.`,
        showConfirmButton: true,
      });
      closeModal('registerModal');
      
      const categoryForm = document.getElementById("categoryForm");
      if (categoryForm) {
        categoryForm.reset();
      } else {
        console.warn("Formulario categoryForm no encontrado");
      }
      
      loadCategoriesInternal(); // Cambiado a la versión sin indicador
    } else {
      showError(data.message || "Error al registrar categoría.");
    }
  } catch (err) {
    console.error("Error al registrar categoría:", err);
    showError("Error al registrar categoría: " + (err.message || err));
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

    const editIdElement = document.getElementById("editId");
    const editNameElement = document.getElementById("editName");
    const editStatusElement = document.getElementById("editStatus");
    
    if (editIdElement) editIdElement.value = category._id;
    if (editNameElement) editNameElement.value = category.name || "";
    if (editStatusElement) editStatusElement.checked = category.status === "active";

    openModal('editModal');
  } catch (err) {
    console.error("Error al cargar la categoría:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar categoría
const updateCategory = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const editIdElement = document.getElementById("editId");
  const editNameElement = document.getElementById("editName");
  
  if (!editIdElement || !editNameElement) {
    showError("No se encontraron los campos del formulario de edición");
    return;
  }

  const id = editIdElement.value;
  const name = editNameElement.value.trim();

  if (!name) {
    showValidation("El nombre es obligatorio.");
    return;
  }

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
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Categoría actualizada correctamente.`,
        showConfirmButton: true,
      });
      closeModal('editModal');
      
      const editForm = document.getElementById("editForm");
      if (editForm) {
        editForm.reset();
      } else {
        console.warn("Formulario editForm no encontrado");
      }
      
      loadCategoriesInternal(); // Cambiado a la versión sin indicador
    } else {
      showError(data.message || "Error al actualizar la categoría.");
    }
  } catch (err) {
    console.error("Error al actualizar categoría:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar estado de categoría
const updateCategoryStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
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
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Categoría ${status === 'active' ? 'activada' : 'desactivada'} correctamente.`,
        showConfirmButton: true,
      });
      
      loadCategoriesInternal(); // Cambiado a la versión sin indicador
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} la categoría (${res.status})`;
      
      if (res.status === 400 && data.message && data.message.includes('active products associated')) {
        Swal.fire({
          icon: 'warning',
          title: 'No se puede desactivar',
          text: 'Esta categoría tiene productos activos asociados. Debe desactivar o reasignar estos productos primero.',
          confirmButtonColor: '#3085d6'
        });
      } else {
        if (data.error) {
          errorMsg += `: ${data.error}`;
        }
        showError(errorMsg);
      }

      console.error("Error response:", {
        status: res.status,
        data: data
      });
      loadCategoriesInternal(); // Cambiado a la versión sin indicador
    }
  } catch (err) {
    console.error("Error al actualizar estado:", err);
    showError(`Ocurrió un error de red: ${err.message || err}`);
    loadCategoriesInternal(); // Cambiado a la versión sin indicador
  }
};

// Eliminar categoría
const deleteCategory = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
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
        text: `Categoría eliminada correctamente.`,
        showConfirmButton: true,
      });
      loadCategoriesInternal(); // Cambiado a la versión sin indicador
    } else {
      showError(data.message || "No se pudo eliminar la categoría");
    }
  } catch (err) {
    console.error("Error al eliminar categoría:", err);
    showError("Error al eliminar categoría: " + (err.message || err));
  }
};

// Buscar categoría
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
  
  allCategories = term
    ? originalCategories.filter(c => 
        (c.name && c.name.toLowerCase().includes(term))
      )
    : [...originalCategories];
  
  currentPage = 1;
  renderCategoriesTable(currentPage);
};

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

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateCategory();
    };
  } else {
    console.warn("Elemento editForm no encontrado");
  }
});

// Exportar funciones globales
window.fillEditForm = fillEditForm;
window.updateCategoryStatus = updateCategoryStatus;
window.deleteCategory = deleteCategory;
window.openModal = openModal;
window.closeModal = closeModal;
window.showRegisterForm = showRegisterForm;
window.hideRegisterForm = hideRegisterForm;