const API_CUSTOMERS = "https://backend-yy4o.onrender.com/api/customers";
let allCustomers = [];
let originalCustomers = [];
let currentPage = 1;
const rowsPerPage = 10;


function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
  // Resetear mensajes de error al abrir el modal
  if (modalId === 'registerModal') {
    clearValidationErrors('customerForm');
    document.getElementById("customerForm").reset();
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function formatDateForDisplay(dateString) {
  if (!dateString) return "N/A";
  
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

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

// Función para validar email
function validateEmail(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!field.value.trim()) {
    errorElement.textContent = "El campo es obligatorio.";
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

// Función para validar teléfono
function validatePhone(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El campo es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!/^\d+$/.test(field.value.trim())) {
    errorElement.textContent = "El número de teléfono debe contener solo dígitos.";
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

const renderCustomersTable = (page = 1) => {
  const tbody = document.getElementById("customerTableBody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const customersToShow = allCustomers.slice(start, end);

  customersToShow.forEach(customer => {
    tbody.innerHTML += `
      <tr>
        <td>${customer.name}</td>
        <td>${customer.lastname}</td>
        <td>${customer.email}</td>
        <td>${customer.phone}</td>
        <td>${customer.createdAt || formatDateForDisplay(customer.createdAt)}</td>
        <td>
          <label class="switch">
            <input type="checkbox" ${customer.status === "active" ? "checked" : ""} 
              onchange="updateCustomerStatus('${customer.id || customer._id}', this.checked ? 'active' : 'inactive')" 
              ${customer.isDefault ? "disabled" : ""}>
            <span class="slider round"></span>
          </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${customer.id || customer._id}')" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteCustomer('${customer.id || customer._id}')" class="icon-button delete-button" title="Eliminar"
              ${customer.isDefault ? "disabled" : ""}>
              <i class="material-icons">delete</i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  renderPaginationControls();
};

const renderPaginationControls = () => {
  const totalPages = Math.ceil(allCustomers.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info:nth-child(2)");

  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-nav");
  prevBtn.innerText = "←";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => changePage(currentPage - 1);
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    if (i === currentPage) btn.classList.add("active");
    btn.innerText = i;
    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-nav");
  nextBtn.innerText = "→";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);

  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(startItem + rowsPerPage - 1, allCustomers.length);
  info.innerHTML = `${startItem}-${endItem} de ${allCustomers.length}`;
};

const changePage = (page) => {
  currentPage = page;
  renderCustomersTable(currentPage);
};

const loadCustomersInternal = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_CUSTOMERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      originalCustomers = Array.isArray(data) ? data : [];
      allCustomers = [...originalCustomers];
      currentPage = 1;
      renderCustomersTable(currentPage);
    } else {
      showError(data.message || "Error al listar clientes.");
    }
  } catch (err) {
    console.error("Error al listar clientes:", err);
    showError("Error al listar clientes");
  }
};

const listCustomers = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    showLoadingIndicator();
    
    const res = await fetch(API_CUSTOMERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    hideLoadingIndicator();
    
    if (res.ok) {
      originalCustomers = Array.isArray(data) ? data : [];
      allCustomers = [...originalCustomers];
      currentPage = 1;
      renderCustomersTable(currentPage);
    } else {
      showError(data.message || "Error al listar clientes.");
    }
  } catch (err) {
    hideLoadingIndicator();
    console.error("Error al listar clientes:", err);
    showError("Error al listar clientes");
  }
};

const registerCustomer = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  // Validar campos usando las nuevas funciones
  const nameValid = validateField("name", "El nombre es obligatorio.");
  const lastnameValid = validateField("lastname", "El apellido es obligatorio.");
  const emailValid = validateEmail("email");
  const phoneValid = validatePhone("phone");

  // Si algún campo no es válido, detener el proceso
  if (!nameValid || !lastnameValid || !emailValid || !phoneValid) {
    return;
  }
  
  const name = document.getElementById("name").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();

  const confirmed = await showConfirm({
    title: "¿Confirmas registrar este cliente?",
    text: "Se creará un nuevo cliente con los datos proporcionados.",
    confirmText: "Registrar",
    cancelText: "Cancelar"
  });

  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se ha registrado ningún cliente',
    });
    closeModal('registerModal');
    return;
  }

  try {
    const res = await fetch(API_CUSTOMERS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        name, 
        lastname, 
        email, 
        phone
      })
    });
    const data = await res.json();
    if (res.status === 201 || res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Cliente registrado correctamente.`,
        showConfirmButton: true,
      });
      closeModal('registerModal');
      document.getElementById("customerForm").reset();
      loadCustomersInternal();
    } else {
      showError(data.message || "Error al registrar cliente.");
    }
  } catch (err) {
    console.error("Error al registrar cliente:", err);
    showError("Error al registrar cliente");
  }
};

const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_CUSTOMERS}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos del cliente.");
      return;
    }

    const customer = await res.json();
    document.getElementById("editId").value = customer.id || customer._id;
    document.getElementById("editName").value = customer.name || "";
    document.getElementById("editLastname").value = customer.lastname || "";
    document.getElementById("editEmail").value = customer.email || "";
    document.getElementById("editPhone").value = customer.phone || "";
    
    const isDefaultContainer = document.getElementById("isDefaultContainer");
    if (isDefaultContainer) {
      if (customer.isDefault) {
        isDefaultContainer.style.display = "flex";
      } else {
        isDefaultContainer.style.display = "none";
      }
    }

    openModal("editModal");
  } catch (err) {
    console.error("Error al cargar el cliente:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

const updateCustomer = async (event) => {
  // Si hay un evento, evitar el comportamiento predeterminado del formulario
  if (event) {
    event.preventDefault();
  }
  
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  // Validar campos usando las nuevas funciones
  const nameValid = validateField("editName", "El nombre es obligatorio.");
  const lastnameValid = validateField("editLastname", "El apellido es obligatorio.");
  const emailValid = validateEmail("editEmail");
  const phoneValid = validatePhone("editPhone");

  // Si algún campo no es válido, detener el proceso
  if (!nameValid || !lastnameValid || !emailValid || !phoneValid) {
    return;
  }

  const customerId = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const lastname = document.getElementById("editLastname").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const phone = document.getElementById("editPhone").value.trim();

  try {
    const res = await fetch(`${API_CUSTOMERS}/${customerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        name, 
        lastname, 
        email, 
        phone
      }),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Cliente actualizado correctamente.`,
          showConfirmButton: true,
        });
        closeModal("editModal");
        document.getElementById("editForm").reset();
        loadCustomersInternal();
      } else {
        showError(data.message || "Error al actualizar el cliente.");
      }
    } else {
      const text = await res.text();
      console.error("Respuesta no JSON:", text);
      showError("Error del servidor: No se recibió una respuesta JSON válida");
    }
  } catch (err) {
    console.error("Error al actualizar cliente:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

const updateCustomerStatus = async (id, newStatus) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const customer = allCustomers.find(c => (c.id === id || c._id === id));
  if (customer && customer.isDefault && newStatus === 'inactive') {
    showError("El cliente predeterminado no puede ser desactivado.");
    
    const switchElement = document.querySelector(`input[type="checkbox"][onchange*="${id}"]`);
    if (switchElement) switchElement.checked = true;
    
    return;
  }

  try {
    const res = await fetch(`${API_CUSTOMERS}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Cliente ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente.`,
          showConfirmButton: true,
        });
        loadCustomersInternal();
      } else {
        showError(data.message || "Error al actualizar el estado del cliente.");
        
        const switchElement = document.querySelector(`input[type="checkbox"][onchange*="${id}"]`);
        if (switchElement) switchElement.checked = newStatus !== 'active';
      }
    } else {
      const text = await res.text();
      console.error("Respuesta no JSON:", text);
      showError("Error del servidor: No se recibió una respuesta JSON válida");
      
      const switchElement = document.querySelector(`input[type="checkbox"][onchange*="${id}"]`);
      if (switchElement) switchElement.checked = newStatus !== 'active';
    }
  } catch (err) {
    console.error("Error al actualizar estado del cliente:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
    
    const switchElement = document.querySelector(`input[type="checkbox"][onchange*="${id}"]`);
    if (switchElement) switchElement.checked = newStatus !== 'active';
  }
};

const deleteCustomer = async (id) => {
  const token = localStorage.getItem("token");
  
  const customer = allCustomers.find(c => (c.id === id || c._id === id));
  if (customer && customer.isDefault) {
    showError("El cliente predeterminado no puede ser eliminado.");
    return;
  }
  
  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar este cliente?",
    text: "Esta acción no se puede deshacer.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });
  
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_CUSTOMERS}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Cliente eliminado correctamente.`,
          showConfirmButton: true,
        });
        loadCustomersInternal();
      } else {
        showError(data.message || "No se pudo eliminar el cliente");
      }
    } else {
      const text = await res.text();
      console.error("Respuesta no JSON:", text);
      showError("Error del servidor: No se recibió una respuesta JSON válida");
    }
  } catch (err) {
    console.error("Error al eliminar cliente:", err);
    showError("Error al eliminar cliente");
  }
};

const searchCustomer = () => {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  allCustomers = term
    ? originalCustomers.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.lastname.toLowerCase().includes(term) || 
        c.email.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term))
    : [...originalCustomers];
  currentPage = 1;
  renderCustomersTable(currentPage);
};

// Desactivar validación nativa del navegador en los formularios
function disableNativeBrowserValidation() {
  // Desactivar validación del formulario de registro
  const customerForm = document.getElementById("customerForm");
  if (customerForm) {
    customerForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = customerForm.querySelectorAll("input");
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
    const inputs = editForm.querySelectorAll("input");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Desactivar validación nativa del navegador
  disableNativeBrowserValidation();
  
  listCustomers();
  document.getElementById("mobileAddButton").onclick = () => openModal('registerModal');
  document.getElementById("registerButton").onclick = registerCustomer;
  document.getElementById("searchInput").addEventListener("keyup", searchCustomer);

  // Agregar validación para campos individuales en tiempo real
  document.getElementById("name").addEventListener("blur", () => validateField("name"));
  document.getElementById("lastname").addEventListener("blur", () => validateField("lastname"));
  document.getElementById("email").addEventListener("blur", () => validateEmail("email"));
  document.getElementById("phone").addEventListener("blur", () => validatePhone("phone"));

  document.getElementById("editName").addEventListener("blur", () => validateField("editName"));
  document.getElementById("editLastname").addEventListener("blur", () => validateField("editLastname"));
  document.getElementById("editEmail").addEventListener("blur", () => validateEmail("editEmail"));
  document.getElementById("editPhone").addEventListener("blur", () => validatePhone("editPhone"));

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await updateCustomer(event);
    });
  }
  
  // Asignar el controlador de eventos al botón de actualización
  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.addEventListener("click", async () => {
      await updateCustomer();
    });
  }
});

window.fillEditForm = fillEditForm;
window.deleteCustomer = deleteCustomer;
window.updateCustomerStatus = updateCustomerStatus;
window.openModal = openModal;
window.closeModal = closeModal;
window.searchCustomer = searchCustomer;