// Endpoints de la API
const API_URL = "https://backend-icesoft.onrender.com/api/branches";

// Variables globales para sucursales y paginación
let allBranches = [];
let originalBranches = [];
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

// Renderizar tabla de sucursales
const renderBranchesTable = (page = 1) => {
  const tbody = document.getElementById("branchTableBody");
  if (!tbody) {
    console.error("Elemento #branchTableBody no encontrado");
    return;
  }
  
  tbody.innerHTML = "";

  if (!allBranches || allBranches.length === 0) {
    console.log("No hay sucursales para mostrar");
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">No hay sucursales registradas</td>
      </tr>
    `;
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const branchesToShow = allBranches.slice(start, end);

  branchesToShow.forEach(branch => {
    // Usar console.log para depurar la estructura de cada sucursal
    console.log("Datos de sucursal:", branch);
    
    // Añadir verificación para propiedades faltantes con la estructura correcta
    const id = branch._id || "N/A";
    const branchId = branch.idBranch || "N/A";
    const name = branch.name || "Sin nombre";
    const address = branch.address || "Sin dirección";
    const phone = branch.phone || "Sin teléfono";
    
    tbody.innerHTML += `
      <tr>
        <td>${branchId}</td>
        <td>${name}</td>
        <td>${address}</td>
        <td>${phone}</td>
        <td class="actions-column">
          <button onclick="fillEditForm('${id}')" class="icon-button edit-button" title="Editar">
            <i class="material-icons">edit</i>
          </button>
          <button onclick="deleteBranch('${id}')" class="icon-button delete-button" title="Eliminar">
            <i class="material-icons">delete</i>
          </button>
        </td>
      </tr>
    `;
  });

  renderPaginationControls();
};

// Renderizar controles de paginación
const renderPaginationControls = () => {
  const totalPages = Math.ceil(allBranches.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info:nth-child(2)");
  
  if (!container || !info) {
    console.error("Elementos de paginación no encontrados");
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
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);

  const startItem = allBranches.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(startItem + rowsPerPage - 1, allBranches.length);
  info.innerHTML = `${startItem}-${endItem} de ${allBranches.length}`;
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderBranchesTable(currentPage);
};

// Función para mostrar confirmación
const showConfirm = ({ title, text, confirmText = "Aceptar", cancelText = "Cancelar" }) => {
  return Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  }).then((result) => result.isConfirmed);
};

// Función para mostrar mensajes de éxito
const showSuccess = (message) => {
  Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: message,
  });
};

// Función para mostrar errores
const showError = (message) => {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
  });
};

// Función para mostrar validaciones
const showValidation = (message) => {
  Swal.fire({
    icon: 'warning',
    title: 'Atención',
    text: message,
  });
};

// Validar datos de la sucursal (según el modelo proporcionado)
function validateBranchData(data, isUpdate = false) {
  const errors = {};

  // Validar nombre
  if (!isUpdate || data.name) {
    if (!data.name || data.name.trim() === "") {
      errors.name = "El nombre de la sucursal es obligatorio";
    } else if (data.name.length < 2 || data.name.length > 100) {
      errors.name = "El nombre debe tener entre 2 y 100 caracteres";
    }
  }

  // Validar dirección
  if (!isUpdate || data.address) {
    if (!data.address || data.address.trim() === "") {
      errors.address = "La dirección es obligatoria";
    } else if (data.address.length < 5 || data.address.length > 200) {
      errors.address = "La dirección debe tener entre 5 y 200 caracteres";
    }
  }

  // Validar teléfono (validación básica)
  if (!isUpdate || data.phone) {
    const phoneRegex = /^[+]?[\d\s()-]{10,15}$/;
    if (!data.phone || !phoneRegex.test(data.phone)) {
      errors.phone = "El formato del teléfono no es válido";
    }
  }

  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  };
}

// Listar sucursales desde el backend
const listBranches = async () => {
  try {
    console.log("Iniciando listBranches()");
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token no encontrado");
      
      // Para fines de prueba/desarrollo: cargar datos de ejemplo si no hay token
      loadSampleBranches();
      return;
    }
    
    console.log("Enviando solicitud a API:", API_URL);
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("Respuesta recibida:", res.status);
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Error en la respuesta:", errorData);
      showError(errorData.message || "Error al listar sucursales.");
      
      // Para fines de prueba/desarrollo: cargar datos de ejemplo si hay error
      loadSampleBranches();
      return;
    }
    
    const data = await res.json();
    console.log("Datos recibidos:", data);
    
    // Manejar diferentes estructuras de respuesta
    if (data && (data.branches || Array.isArray(data))) {
      originalBranches = data.branches || data;
      
      // Verificar si los datos tienen la estructura esperada
      console.log("Número de sucursales:", originalBranches.length);
      
      if (originalBranches.length > 0) {
        console.log("Ejemplo de sucursal:", originalBranches[0]);
      }
      
      allBranches = [...originalBranches];
      currentPage = 1;
      renderBranchesTable(currentPage);
    } else {
      console.error("Formato de datos inesperado:", data);
      showError("Error: Formato de datos inesperado");
      
      // Para fines de prueba/desarrollo: cargar datos de ejemplo si el formato es inesperado
      loadSampleBranches();
    }
  } catch (err) {
    console.error("Error al listar sucursales:", err);
    showError("Error al listar sucursales: " + (err.message || "Error desconocido"));
    
    // Para fines de prueba/desarrollo: cargar datos de ejemplo si hay excepción
    loadSampleBranches();
  }
};

// Función para cargar datos de ejemplo (para pruebas/desarrollo)
const loadSampleBranches = () => {
  console.log("Cargando datos de ejemplo");
  originalBranches = [
    {
      _id: "sample1",
      idBranch: "61a1234567890123456789ab",
      name: "Sucursal Central",
      address: "Ciudad de México, Av. Principal 123",
      phone: "+52 55 1234 5678"
    },
    {
      _id: "sample2",
      idBranch: "61b1234567890123456789ab",
      name: "Sucursal Norte",
      address: "Monterrey, Blvd. Norte 456",
      phone: "+52 81 8765 4321"
    },
    {
      _id: "sample3",
      idBranch: "61c1234567890123456789ab",
      name: "Sucursal Sur",
      address: "Cancún, Zona Hotelera 789",
      phone: "+52 998 123 4567"
    },
    {
      _id: "sample4",
      idBranch: "61d1234567890123456789ab",
      name: "Sucursal Este",
      address: "Veracruz, Puerto 321",
      phone: "+52 229 987 6543"
    }
  ];
  allBranches = [...originalBranches];
  currentPage = 1;
  renderBranchesTable(currentPage);
};

// Registrar sucursal
const registerBranch = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  // Obtener valores del formulario según la estructura del modelo
  const name = document.getElementById("name").value.trim();
  const address = document.getElementById("location").value.trim(); // El campo en HTML es location pero lo enviamos como address
  const additionalAddress = document.getElementById("address").value.trim();
  const phone = document.getElementById("phone").value.trim();

  // Combinar direcciones si es necesario
  const fullAddress = additionalAddress 
    ? `${address}, ${additionalAddress}`
    : address;

  const branchData = { 
    name, 
    address: fullAddress,
    phone
  };
  
  // Validar datos
  const validation = validateBranchData(branchData);
  if (!validation.isValid) {
    const errorMessages = Object.values(validation.errors).join("\n");
    showValidation(errorMessages);
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas registrar esta sucursal?",
    text: "Se creará una nueva sucursal con los datos proporcionados.",
    confirmText: "Registrar",
    cancelText: "Cancelar"
  });

  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se ha registrado ninguna sucursal',
    });
    closeModal('registerModal');
    return;
  }

  try {
    console.log("Datos a enviar:", branchData);
    
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(branchData)
    });
    
    const data = await res.json();
    console.log("Respuesta al registrar:", data);
    
    if (res.status === 201 || res.ok) {
      showSuccess("Sucursal registrada correctamente.");
      closeModal('registerModal');
      document.getElementById("branchForm").reset();
      listBranches();
    } else {
      if (data.errors) {
        // Mostrar errores específicos de validación del backend
        const errorMessages = Object.values(data.errors).join("\n");
        showError(errorMessages);
      } else {
        showError(data.message || "Error al registrar sucursal.");
      }
    }
  } catch (err) {
    console.error("Error al registrar sucursal:", err);
    showError("Error al registrar sucursal");
  }
};

// Llenar formulario de edición
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  const confirmed = await showConfirm({
    title: "¿Deseas editar esta sucursal?",
    text: "Vas a modificar la información de esta sucursal.",
    confirmText: "Editar",
    cancelText: "Cancelar",
  });

  if (!confirmed) {
    Swal.fire({
      icon: "info",
      title: "Operación cancelada",
      text: "No se editará esta sucursal",
    });
    return;
  }

  try {
    // Para datos de ejemplo
    if (id.startsWith("sample")) {
      const branch = originalBranches.find(b => b._id === id);
      if (branch) {
        document.getElementById("editId").value = branch._id;
        document.getElementById("editName").value = branch.name || "";
        
        // Dividir la dirección para los campos location y address si es necesario
        const addressParts = (branch.address || "").split(", ");
        document.getElementById("editLocation").value = addressParts[0] || "";
        document.getElementById("editAddress").value = addressParts.length > 1 ? addressParts.slice(1).join(", ") : "";
        
        document.getElementById("editPhone").value = branch.phone || "";
        openModal("editModal");
      }
      return;
    }
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos de la sucursal.");
      return;
    }

    const branch = await res.json();
    document.getElementById("editId").value = branch._id;
    document.getElementById("editName").value = branch.name || "";
    
    // Dividir la dirección para los campos location y address si es necesario
    const addressParts = (branch.address || "").split(", ");
    document.getElementById("editLocation").value = addressParts[0] || "";
    document.getElementById("editAddress").value = addressParts.length > 1 ? addressParts.slice(1).join(", ") : "";
    
    document.getElementById("editPhone").value = branch.phone || "";

    openModal("editModal");
  } catch (err) {
    console.error("Error al cargar la sucursal:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar sucursal
const updateBranch = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const location = document.getElementById("editLocation").value.trim();
  const additionalAddress = document.getElementById("editAddress").value.trim();
  const phone = document.getElementById("editPhone").value.trim();

  // Combinar address y location si es necesario
  const fullAddress = additionalAddress 
    ? `${location}, ${additionalAddress}`
    : location;

  const branchData = { 
    name, 
    address: fullAddress, 
    phone
  };
  
  // Validar datos
  const validation = validateBranchData(branchData, true);
  if (!validation.isValid) {
    const errorMessages = Object.values(validation.errors).join("\n");
    showValidation(errorMessages);
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas actualizar esta sucursal?",
    text: "Se guardarán los cambios realizados.",
    confirmText: "Actualizar",
    cancelText: "Cancelar",
  });

  if (!confirmed) return;

  try {
    // Para datos de ejemplo
    if (id.startsWith("sample")) {
      const index = originalBranches.findIndex(b => b._id === id);
      if (index !== -1) {
        originalBranches[index] = {
          ...originalBranches[index],
          name,
          address: fullAddress,
          phone
        };
        allBranches = [...originalBranches];
        renderBranchesTable(currentPage);
        showSuccess("Sucursal actualizada correctamente.");
        closeModal("editModal");
        document.getElementById("editForm").reset();
      }
      return;
    }
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(branchData)
    });

    const data = await res.json();
    if (res.ok) {
      showSuccess("Sucursal actualizada correctamente.");
      closeModal("editModal");
      document.getElementById("editForm").reset();
      listBranches();
    } else {
      if (data.errors) {
        // Mostrar errores específicos de validación del backend
        const errorMessages = Object.values(data.errors).join("\n");
        showError(errorMessages);
      } else {
        showError(data.message || "Error al actualizar la sucursal.");
      }
    }
  } catch (err) {
    console.error("Error al actualizar sucursal:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Eliminar sucursal
const deleteBranch = async (id) => {
  const token = localStorage.getItem("token");
  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar esta sucursal?",
    text: "Esta acción no se puede deshacer.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });
  
  if (!confirmed) return;

  try {
    // Para datos de ejemplo
    if (id.startsWith("sample")) {
      originalBranches = originalBranches.filter(b => b._id !== id);
      allBranches = [...originalBranches];
      renderBranchesTable(currentPage);
      showSuccess("Sucursal eliminada correctamente.");
      return;
    }
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    // Intentamos obtener la respuesta JSON
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { message: res.ok ? "Sucursal eliminada" : "Error al eliminar" };
    }
    
    if (res.ok) {
      showSuccess("Sucursal eliminada correctamente.");
      listBranches();
    } else {
      showError(data.message || "No se pudo eliminar la sucursal");
    }
  } catch (err) {
    console.error("Error al eliminar sucursal:", err);
    showError("Error al eliminar sucursal");
  }
};

// Buscar sucursal
const searchBranch = () => {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  allBranches = term
    ? originalBranches.filter(b => 
        (b.name && b.name.toLowerCase().includes(term)) || 
        (b.address && b.address.toLowerCase().includes(term)) ||
        (b.phone && b.phone.toLowerCase().includes(term)) ||
        (b.idBranch && b.idBranch.toString().includes(term))
      )
    : [...originalBranches];
  currentPage = 1;
  renderBranchesTable(currentPage);
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado, inicializando...");
  
  // Cargar sucursales
  listBranches();
  
  // Configurar botones y eventos
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
  } else {
    console.error("Elemento #mobileAddButton no encontrado");
  }
  
  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.onclick = registerBranch;
  } else {
    console.error("Elemento #registerButton no encontrado");
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchBranch);
  } else {
    console.error("Elemento #searchInput no encontrado");
  }

  // Añadir evento de actualización para el botón en el modal de edición
  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.onclick = updateBranch;
  } else {
    console.error("Elemento #updateButton no encontrado");
  }

  // Añadir evento de submit para el formulario de edición
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateBranch();
    };
  } else {
    console.error("Elemento #editForm no encontrado");
  }
  
  // Verificar si existe el contenedor de la tabla
  const tableBody = document.getElementById("branchTableBody");
  if (!tableBody) {
    console.error("Elemento #branchTableBody no encontrado. Asegúrese de que el HTML contenga este elemento.");
  }
});

// Hacer funciones globales si es necesario
window.fillEditForm = fillEditForm;
window.deleteBranch = deleteBranch;
window.openModal = openModal;
window.closeModal = closeModal;