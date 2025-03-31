const API_URL = "http://localhost:3001/api/categories";
  
// Variables globales para categorías y paginación
let allCategories = [];
let originalCategories = [];
let currentPage = 1;
const rowsPerPage = 10;

// Renderizar tabla de categorías
const renderCategoriesTable = (page = 1) => {
  const tbody = document.getElementById("categoryTableBody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const categoriesToShow = allCategories.slice(start, end);

  categoriesToShow.forEach(category => {
    tbody.innerHTML += `
      <tr>
        <td>${category.id}</td>
        <td>${category.name}</td>
        <td>${category.description}</td>
        <td>
          <label class="switch">
            <input type="checkbox" ${category.status === "active" ? "checked" : ""} disabled>
            <span class="slider round"></span>
          </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${category._id}')" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteCategory('${category._id}')" class="icon-button delete-button" title="Eliminar">
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
  const totalPages = Math.ceil(allCategories.length / rowsPerPage);
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
  const endItem = Math.min(startItem + rowsPerPage - 1, allCategories.length);
  info.innerHTML = `${startItem}-${endItem} de ${allCategories.length}`;
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderCategoriesTable(currentPage);
};

// Función para abrir un modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}

// Función para cerrar un modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Cerrar el modal si el usuario hace clic fuera del contenido
window.onclick = function(event) {
  const registerModal = document.getElementById("registerModal");
  const editModal = document.getElementById("editModal");
  
  if (event.target === registerModal) {
    registerModal.style.display = "none";
  }
  if (event.target === editModal) {
    editModal.style.display = "none";
  }
};

// Mostrar formulario de registro
const showRegisterForm = () => {
  hideForms();
  document.getElementById("registerFormSection").style.display = "block";
  document.getElementById("formTitle").textContent = "Registrar Categoría";
  window.scrollTo(0, document.body.scrollHeight);
};

// Ocultar formulario de registro
const hideRegisterForm = () => {
  document.getElementById("registerFormSection").style.display = "none";
  document.getElementById("categoryForm").reset();
};

// Ocultar formularios (registro y edición)
const hideForms = () => {
  document.getElementById("registerFormSection").style.display = "none";
  document.getElementById("editFormSection").style.display = "none";
};

// Listar categorías desde el backend
const listCategories = async () => {
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
      allCategories = [...originalCategories];
      currentPage = 1;
      renderCategoriesTable(currentPage);
    } else {
      showError(data.message || "Error al listar categorías.");
    }
  } catch (err) {
    console.error("Error al listar categorías:", err);
    showError("Error al listar categorías");
  }
};

// Registrar categoría
const registerCategory = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const status = document.getElementById("status").checked ? "active" : "inactive";

  if (!name || !description) {
    showValidation("Todos los campos son obligatorios.");
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas registrar esta categoría?",
    text: "Se creará una nueva categoría con los datos proporcionados.",
    confirmText: "Registrar",
    cancelText: "Cancelar"
  });

  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se ha registrado ninguna categoría',
    });
    closeModal('registerModal');
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, status })
    });
    const data = await res.json();
    if (res.status === 201 || res.ok) {
      showSuccess("Categoría registrada correctamente.");
      closeModal('registerModal');
      document.getElementById("userForm").reset();
      listCategories();
    } else {
      showError(data.message || "Error al registrar categoría.");
    }
  } catch (err) {
    console.error("Error al registrar categoría:", err);
    showError("Error al registrar categoría");
  }
};

const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");

  const confirmed = await showConfirm({
    title: "¿Deseas editar esta categoría?",
    text: "Vas a modificar la información de esta categoría.",
    confirmText: "Editar",
    cancelText: "Cancelar"
  });

  console.log("Confirmación del usuario:", confirmed);
  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se editará esta categoría',
    });
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
    console.log("Categoría cargada:", category);

    document.getElementById("editId").value = category._id;
    document.getElementById("editName").value = category.name || "";
    document.getElementById("editDescription").value = category.description || "";
    document.getElementById("editStatus").checked = category.status === "active";

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

  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const description = document.getElementById("editDescription").value.trim();
  const status = document.getElementById("editStatus").checked ? "active" : "inactive";

  console.log("Valores a enviar:", { id, name, description, status });

  if (!name || !description) {
    showValidation("Todos los campos son obligatorios.");
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas actualizar esta categoría?",
    text: "Se guardarán los cambios realizados.",
    confirmText: "Actualizar",
    cancelText: "Cancelar"
  });

  console.log("Confirmación del usuario:", confirmed);
  if (!confirmed) return;

  try {
    console.log("URL de la API:", `${API_URL}/${id}`);
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, status })
    });

    const data = await res.json();
    console.log("Respuesta del servidor:", data);

    if (res.ok) {
      showSuccess("Categoría actualizada correctamente.");
      closeModal('editModal');
      document.getElementById("editForm").reset();
      listCategories();
    } else {
      showError(data.message || "Error al actualizar la categoría.");
    }
  } catch (err) {
    console.error("Error al actualizar categoría:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Eliminar categoría
const deleteCategory = async (id) => {
  const token = localStorage.getItem("token");
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
      showSuccess("Categoría eliminada");
      listCategories();
    } else {
      showError(data.message || "No se pudo eliminar la categoría");
    }
  } catch (err) {
    console.error("Error al eliminar categoría:", err);
    showError("Error al eliminar categoría");
  }
};

// Buscar categoría
const searchCategory = () => {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  allCategories = term
    ? originalCategories.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.description.toLowerCase().includes(term)
      )
    : [...originalCategories];
  currentPage = 1;
  renderCategoriesTable(currentPage);
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  listCategories();
  document.getElementById("mobileAddButton").onclick = () => openModal('registerModal');
  document.getElementById("registerButton").onclick = registerCategory;
  document.getElementById("searchInput").addEventListener("keyup", searchCategory);

  // Añadir evento de submit para el formulario de edición
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateCategory();
    };
  }
});

// Hacer funciones globales si es necesario
window.fillEditForm = fillEditForm;
window.deleteCategory = deleteCategory;
window.openModal = openModal;
window.closeModal = closeModal;
window.showRegisterForm = showRegisterForm;
window.hideRegisterForm = hideRegisterForm;