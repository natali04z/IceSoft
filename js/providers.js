// Endpoints de la API
const API_PROVIDERS = "http://localhost:3001/api/providers";

// Variables globales para proveedores y paginación
let allProviders = [];
let originalProviders = [];
let currentPage = 1;
const rowsPerPage = 10;

// Renderizar tabla de proveedores
const renderProvidersTable = (page = 1) => {
  const tbody = document.getElementById("providerTableBody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const providersToShow = allProviders.slice(start, end);

  providersToShow.forEach(provider => {
    tbody.innerHTML += `
      <tr>
        <td>${provider.id}</td>
        <td>${provider.name}</td>
        <td>${provider.contact_number}</td>
        <td>${provider.address}</td>
        <td>${provider.email}</td>
        <td>${provider.personal_phone}</td>
        <td>
            <label class="switch">
                <input type="checkbox" ${provider.status === "active" ? "checked" : ""} disabled>
                <span class="slider round"></span>
            </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${provider._id}')" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteProvider('${provider._id}')" class="icon-button delete-button" title="Eliminar">
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
  const totalPages = Math.ceil(allProviders.length / rowsPerPage);
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
  const endItem = Math.min(startItem + rowsPerPage - 1, allProviders.length);
  info.innerHTML = `${startItem}-${endItem} de ${allProviders.length}`;
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderProvidersTable(currentPage);
};

// Listar proveedores desde el backend
const listProviders = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    const res = await fetch(API_PROVIDERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      originalProviders = data.providers || data;
      allProviders = [...originalProviders];
      currentPage = 1;
      renderProvidersTable(currentPage);
    } else {
      showError(data.message || "Error al listar proveedores.");
    }
  } catch (err) {
    console.error("Error al listar proveedores:", err);
    showError("Error al listar proveedores");
  }
};

// Mostrar formulario de registro
const showRegisterForm = () => {
  hideForms();
  document.getElementById("registerFormSection").style.display = "block";
  document.getElementById("formTitle").textContent = "Registrar Proveedor";
  window.scrollTo(0, document.body.scrollHeight);
};

// Ocultar formulario de registro
const hideRegisterForm = () => {
  document.getElementById("registerFormSection").style.display = "none";
  document.getElementById("providerForm").reset();
};

// Registrar proveedor
const registerProvider = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const name = document.getElementById("name").value.trim();
  const contact_number = document.getElementById("contact_number").value.trim();
  const address = document.getElementById("address").value.trim();
  const email = document.getElementById("email").value.trim();
  const personal_phone = document.getElementById("personal_phone").value.trim();
  
  // Para el registro, el estado se controla por el switch
  const status = document.getElementById("status") 
    ? (document.getElementById("status").checked ? "active" : "inactive")
    : "active";

  // Validación básica de campos
  if (!name || !contact_number || !address || !email || !personal_phone) {
    showValidation("Todos los campos son obligatorios.");
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas registrar este proveedor?",
    text: "Se creará un nuevo proveedor con los datos proporcionados.",
    confirmText: "Registrar",
    cancelText: "Cancelar"
  });

  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se ha registrado ningún proveedor',
    });
    hideRegisterForm();
    return;
  }

  try {
    const res = await fetch(API_PROVIDERS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        name, 
        contact_number, 
        address, 
        email, 
        personal_phone, 
        status 
      })
    });
    
    const data = await res.json();
    if (res.status === 201 || res.ok) {
      showSuccess("Proveedor registrado correctamente.");
      hideRegisterForm();
      listProviders();
    } else {
      showError(data.message || "Error al registrar proveedor.");
    }
  } catch (err) {
    console.error("Error al registrar proveedor:", err);
    showError("Error al registrar proveedor");
  }
};

// Llenar formulario de edición de proveedor
// Llenar formulario de edición
const fillEditForm = async (id) => {
    const token = localStorage.getItem("token");

    console.log("ID recibido en fillEditForm:", id); // Verifica que el ID es correcto

    const confirmed = await showConfirm({
        title: "¿Deseas editar este proveedor?",
        text: "Vas a modificar la información de este proveedor.",
        confirmText: "Editar",
        cancelText: "Cancelar"
    });

    if (!confirmed) {
        Swal.fire({
            icon: 'info',
            title: 'Operación cancelada',
            text: 'No se editará este proveedor',
        });
        return;
    }

    try {
        const res = await fetch(`${API_PROVIDERS}/${encodeURIComponent(id)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            showError(data.message || "Error al cargar los datos del proveedor.");
            return;
        }

        console.log("Proveedor recibido:", data); // Verifica la estructura de la respuesta

        // Llenar los campos del formulario de edición
        document.getElementById("editId").value = data._id;
        document.getElementById("editName").value = data.name || "";
        document.getElementById("editContactNumber").value = data.contact_number || "";
        document.getElementById("editAddress").value = data.address || "";
        document.getElementById("editEmail").value = data.email || "";
        document.getElementById("editPersonalPhone").value = data.personal_phone || "";
        document.getElementById("editStatus").checked = data.status === "active";

        hideForms();
        document.getElementById("editFormSection").style.display = "block";
        window.scrollTo(0, document.body.scrollHeight);

        const editForm = document.getElementById("editForm");
        editForm.onsubmit = async (event) => {
            event.preventDefault();
            await updateProvider(id);
        };
    } catch (err) {
        console.error("Error al cargar el proveedor:", err);
        showError(`Ocurrió un error: ${err.message || err}`);
    }
};

// Función para actualizar un proveedor
const updateProvider = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }

    const name = document.getElementById("editName").value.trim();
    const contact_number = document.getElementById("editContactNumber").value.trim();
    const address = document.getElementById("editAddress").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const personal_phone = document.getElementById("editPersonalPhone").value.trim();
    const status = document.getElementById("editStatus").checked ? "active" : "inactive";

    if (!name || !contact_number || !address || !email || !personal_phone) {
        showValidation("Todos los campos son obligatorios.");
        return;
    }

    const confirmed = await showConfirm({
        title: "¿Confirmas actualizar este proveedor?",
        text: "Se guardarán los cambios realizados.",
        confirmText: "Actualizar",
        cancelText: "Cancelar"
    });

    if (!confirmed) return;

    try {
        const res = await fetch(`${API_PROVIDERS}/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name, contact_number, address, email, personal_phone, status })
        });

        const data = await res.json();
        console.log("Respuesta del servidor:", data);

        if (res.ok) {
            showSuccess("Proveedor actualizado correctamente.");
            hideForms();
            listProviders();
        } else {
            showError(data.message || "Error al actualizar el proveedor.");
        }
    } catch (err) {
        console.error("Error al actualizar proveedor:", err);
        showError(`Ocurrió un error: ${err.message || err}`);
    }
};  

// Buscar proveedor
const searchProvider = () => {
    const term = document.getElementById("searchInput").value.toLowerCase().trim();
    
    allProviders = term
        ? originalProviders.filter(p => p.name.toLowerCase().includes(term))
        : [...originalProviders];

    currentPage = 1;
    renderProvidersTable(currentPage);
};

// Ocultar formularios (registro y edición)
const hideForms = () => {
  document.getElementById("registerFormSection").style.display = "none";
  document.getElementById("editFormSection").style.display = "none";
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  listProviders();
  document.getElementById("mobileAddButton").onclick = showRegisterForm;
  document.getElementById("registerButton").onclick = registerProvider;
  document.getElementById("searchInput").addEventListener("keyup", searchProvider);
});

// Hacer funciones globales si es necesario
window.fillEditForm = fillEditForm;
window.deleteProvider = deleteProvider;