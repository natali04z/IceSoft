// Endpoints de la API
const API_URL = "http://localhost:3001/api/users";
const API_AUTH = "http://localhost:3001/api/auth/register";

// Variables globales para usuarios y paginación
let allUsers = [];
let originalUsers = [];
let currentPage = 1;
const rowsPerPage = 10;

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

// Renderizar tabla de usuarios
const renderUsersTable = (page = 1) => {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const usersToShow = allUsers.slice(start, end);

  usersToShow.forEach(user => {
    tbody.innerHTML += `
      <tr>
        <td>${user.name}</td>
        <td>${user.lastname}</td>
        <td>${user.contact_number}</td>
        <td>${user.email}</td>
        <td>${user.role?.name || "No Rol"}</td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${user._id}')" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteUser('${user._id}')" class="icon-button delete-button" title="Eliminar">
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

// Listar usuarios desde el backend
const listUsers = async () => {
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
      allUsers = [...originalUsers];
      currentPage = 1;
      renderUsersTable(currentPage);
    } else {
      showError(data.message || "No tienes permisos para listar usuarios.");
    }
  } catch (err) {
    console.error("Error al listar usuarios:", err);
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

  const name = document.getElementById("name").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const contact_number = document.getElementById("contact_number").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  if (!name || !lastname || !email || !contact_number || !password || !role) {
    showValidation("Todos los campos son obligatorios.");
    return;
  }

  const confirmed = await showConfirm({ 
    title: "¿Confirmas registrar este usuario?", 
    text: "Se creará un nuevo usuario con los datos proporcionados.", 
    confirmText: "Registrar", 
    cancelText: "Cancelar" 
  });

  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se ha registrado ningún usuario',
    });
    closeModal('registerModal');
    return;
  }

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
      showSuccess("Usuario registrado correctamente.");
      closeModal('registerModal');
      document.getElementById("userForm").reset();
      listUsers();
    } else {
      showError(data.message || "Error al registrar usuario.");
    }
  } catch (err) {
    console.error("Error al registrar usuario:", err);
    showError("Error al registrar usuario");
  }
};

// Llenar formulario de edición con datos del usuario
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");

  const confirmed = await showConfirm({ 
    title: "¿Deseas editar este usuario?", 
    text: "Vas a modificar la información de este usuario.", 
    confirmText: "Editar", 
    cancelText: "Cancelar" 
  });

  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se editará este usuario',
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
      showError(data.message || "Error al cargar los datos del usuario.");
      return;
    }

    const user = await res.json();
    document.getElementById("editId").value = user._id || "";
    document.getElementById("editName").value = user.name || "";
    document.getElementById("editLastname").value = user.lastname || "";
    document.getElementById("editContact").value = user.contact_number || "";
    document.getElementById("editEmail").value = user.email || "";
    document.getElementById("editRole").value = user.role?._id || "";

    openModal("editModal");
  } catch (err) {
    console.error("Error al cargar el usuario:", err);
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

  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const lastname = document.getElementById("editLastname").value.trim();
  const contact_number = document.getElementById("editContact").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const role = document.getElementById("editRole").value;

  if (!name || !lastname || !email || !contact_number || !role) {
    showValidation("Todos los campos son obligatorios.");
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas actualizar este usuario?", 
    text: "Se guardarán los cambios realizados.", 
    confirmText: "Actualizar", 
    cancelText: "Cancelar"
  });

  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se actualizará el usuario',
    });
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, lastname, email, contact_number, role })
    });

    const data = await res.json();
    console.log("Respuesta del servidor:", data);

    if (res.ok) {
      showSuccess("Usuario actualizado correctamente.");
      closeModal("editModal");
      document.getElementById("editForm").reset();
      listUsers();
    } else {
      showError(data.message || "Error al actualizar el usuario.");
    }
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Eliminar usuario
const deleteUser = async (id) => {
  const token = localStorage.getItem("token");

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
      showSuccess("Usuario eliminado");
      listUsers();
    } else {
      showError(data.message || "No se pudo eliminar el usuario");
    }
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    showError("Error al eliminar usuario");
  }
};

// Buscar usuario
const searchUser = () => {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  allUsers = term
    ? originalUsers.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    : [...originalUsers];
  currentPage = 1;
  renderUsersTable(currentPage);
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  listUsers();
  document.getElementById("mobileAddButton").onclick = () => openModal('registerModal');
  document.getElementById("registerButton").onclick = registerUser;
  document.getElementById("searchInput").addEventListener("keyup", searchUser);

  // Añadir evento de submit para el formulario de edición
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateUser();
    };
  }
});

// Hacer funciones globales si es necesario
window.fillEditForm = fillEditForm;
window.deleteUser = deleteUser;
window.openModal = openModal;
window.closeModal = closeModal;