const API_CUSTOMERS = "https://backend-alpha-orpin-58.vercel.app/api/customers";

// Variables globales para clientes y paginación
let allCustomers = [];
let originalCustomers = [];
let currentPage = 1;
const rowsPerPage = 10;

// ===== FUNCIONES HELPER PARA FECHAS =====

/**
 * Convierte una fecha a formato YYYY-MM-DD respetando la zona horaria local
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function formatLocalDate(date = new Date()) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (zona local)
 * @returns {string} Fecha actual en formato YYYY-MM-DD
 */
function getTodayLocal() {
  return formatLocalDate(new Date());
}

/**
 * Formatea fecha para mostrar al usuario (DD/MM/YYYY)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada para mostrar
 */
function formatDateForDisplay(date) {
  if (!date) return "Fecha no disponible";
  
  try {
    // Si viene en formato YYYY-MM-DD, parsearlo correctamente
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('es-CO'); // Formato DD/MM/YYYY
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-CO'); // Formato DD/MM/YYYY
  } catch (e) {
    return date.toString();
  }
}

/**
 * Convierte fecha de string YYYY-MM-DD a objeto Date (zona local)
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {Date} Objeto Date en zona local
 */
function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  
  // Dividir la fecha para evitar problemas de zona horaria
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
}

// ===== FUNCIONES DE VALIDACIÓN =====

// Función para validar un campo y mostrar error
function validateField(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field || !errorElement) {
    console.warn(`Elemento no encontrado: ${fieldId} o ${fieldId}-error`);
    return false;
  }
  
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
  
  if (!field || !errorElement) {
    console.warn(`Elemento no encontrado: ${fieldId} o ${fieldId}-error`);
    return false;
  }
  
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

// Función para validar teléfono - ACTUALIZADA
function validatePhone(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field || !errorElement) {
    console.warn(`Elemento no encontrado: ${fieldId} o ${fieldId}-error`);
    return false;
  }
  
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

// Función para establecer validación de campos numéricos - ACTUALIZADA
function setupPhoneNumberValidation() {
  const phoneInputs = document.querySelectorAll('#phone, #editPhone');
  
  // Validación para teléfonos (solo números)
  phoneInputs.forEach(input => {
    if (input) {
      input.addEventListener('keypress', function(e) {
        if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
          e.preventDefault();
        }
      });
      
      input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
      });
    }
  });
}

// Desactivar validación nativa del navegador en los formularios
function disableNativeBrowserValidation() {
  const customerForm = document.getElementById("customerForm");
  if (customerForm) {
    customerForm.setAttribute("novalidate", "");
    const inputs = customerForm.querySelectorAll("input");
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

/**
 * Verifica si un cliente es predeterminado
 * @param {string} customerId - ID del cliente a verificar
 * @returns {boolean} true si es cliente predeterminado
 */
function isDefaultCustomer(customerId) {
  // Buscar en allCustomers primero
  const customerInAll = allCustomers.find(c => (c.id || c._id) === customerId);
  if (customerInAll && customerInAll.isDefault) {
    return true;
  }
  
  // Buscar en originalCustomers como respaldo
  const customerInOriginal = originalCustomers.find(c => (c.id || c._id) === customerId);
  if (customerInOriginal && customerInOriginal.isDefault) {
    return true;
  }
  
  // Verificar en el DOM si tiene la clase especial
  const row = document.querySelector(`tr[data-customerid="${customerId}"]`);
  if (row && row.classList.contains('customer-default')) {
    return true;
  }
  
  return false;
}

function getUserPermissions() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return ['edit_customers', 'delete_customers'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['edit_customers', 'delete_customers'];
  } catch (error) {
    return ['edit_customers', 'delete_customers'];
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = "flex";
  
  if (modalId === 'registerModal') {
    clearValidationErrors('customerForm');
    
    const customerForm = document.getElementById("customerForm");
    if (customerForm) {
      customerForm.reset();
    }
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = "none";
}

// Función para mostrar alertas más específicas
function showAlert({ type = 'info', title, message, icon = 'info' }) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: icon,
      title: title,
      text: message,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3085d6'
    });
  } else {
    alert(`${title}\n\n${message}`);
  }
}

// ===== FUNCIONES DE FORMATEO =====

// ✅ NUEVA IMPLEMENTACIÓN - usando la función helper para DD/MM/YYYY
const formatDate = (dateString) => {
  return formatDateForDisplay(dateString);
};

// ===== FUNCIONES DE RENDERIZADO (Estructura mejorada con protección cliente predeterminado) =====

const renderCustomersTable = (page = 1) => {
  const tbody = document.getElementById("customerTableBody");
  
  if (!tbody) {
    return;
  }
  
  tbody.innerHTML = "";

  if (!allCustomers || allCustomers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          No hay clientes disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const customersToShow = allCustomers.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditCustomers = userPermissions.includes("edit_customers");
  const canDeleteCustomers = userPermissions.includes("delete_customers");
  
  let tableContent = '';

  customersToShow.forEach((customer, index) => {
    try {
      const customerId = customer.id || customer._id || "";
      const displayId = customer.id || customerId || `Cu${String(index + 1).padStart(2, '0')}`;
      
      const isDefault = customer.isDefault === true;
      
      const isDefaultClass = isDefault ? 'customer-default' : '';
      const defaultBadge = isDefault ? '<span class="default-badge">Predeterminado</span>' : '';
      const status = customer.status || "active";
      
      // Formatear fecha
      const createdDate = formatDate(customer.createdAt);
      
      tableContent += `
        <tr data-customerid="${customerId}" data-index="${index}" class="${isDefaultClass}">
          <td class="id-column">${customer.name || ''} ${defaultBadge}</td>
          <td>${customer.lastname || ''}</td>
          <td>${customer.phone || ''}</td>
          <td>${customer.email || ''}</td>
          <td>${createdDate}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                onchange="updateCustomerStatus('${customerId}', this.checked ? 'active' : 'inactive')">
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${customerId}')" class="icon-button edit-button" title="Editar cliente">
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deleteCustomer('${customerId}')" class="icon-button delete-button" title="Eliminar cliente">
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
            Error al renderizar este cliente: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  renderPaginationControls();
};

const renderPaginationControls = () => {
  if (!allCustomers || allCustomers.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allCustomers.length / rowsPerPage);
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
    const startItem = allCustomers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allCustomers.length);
    info.innerHTML = `${startItem}-${endItem} de ${allCustomers.length}`;
  }
};

const changePage = (page) => {
  currentPage = page;
  renderCustomersTable(currentPage);
};

// ===== FUNCIONES DE CARGA DE DATOS =====

const loadCustomersInternal = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_CUSTOMERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo listar los clientes.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      showError("Error al listar los clientes.");
      return;
    }
    
    let customers = [];
    
    // Manejar diferentes estructuras de respuesta
    if (data && data.success && data.data) {
      customers = data.data;
    } else if (data && typeof data === 'object' && data.customers) {
      customers = data.customers;
    } else if (Array.isArray(data)) {
      customers = data;
    } else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        customers = data[arrayProps[0]];
      } else {
        customers = [];
      }
    } else {
      customers = [];
    }
    
    if (!Array.isArray(customers)) {
      customers = [];
    }

    customers = customers.map(customer => {
      let adaptedCustomer = {...customer};
      
      if (!adaptedCustomer || typeof adaptedCustomer !== 'object') {
        return {};
      }
      
      
      if (adaptedCustomer.created_at === undefined && adaptedCustomer.createdAt !== undefined) {
        adaptedCustomer.created_at = adaptedCustomer.createdAt;
      } else if (adaptedCustomer.createdAt === undefined && adaptedCustomer.created_at !== undefined) {
        adaptedCustomer.createdAt = adaptedCustomer.created_at;
      }
      
      
      if (adaptedCustomer.status === undefined) {
        adaptedCustomer.status = "active";
      }
      
      return adaptedCustomer;
    }).filter(customer => customer && typeof customer === 'object' && Object.keys(customer).length > 0);
    
    originalCustomers = customers;
    allCustomers = [...originalCustomers];
    currentPage = 1;
    
    renderCustomersTable(currentPage);
    
    const tbody = document.getElementById("customerTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            No se encontraron clientes. Puede que necesite agregar un nuevo cliente o revisar su conexión.
          </td>
        </tr>
      `;
    }
  } catch (err) {
    showError("Error al listar clientes");
    console.error("Error in loadCustomersInternal:", err);
  }
};

const listCustomers = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
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
    
    hideLoadingIndicator();
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo listar los clientes.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      hideLoadingIndicator();
      showError("Error al listar los clientes.");
      return;
    }
    
    let customers = [];
    
    if (data && data.success && data.data) {
      customers = data.data;
    } else if (data && typeof data === 'object' && data.customers) {
      customers = data.customers;
    } else if (Array.isArray(data)) {
      customers = data;
    } else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        customers = data[arrayProps[0]];
      } else {
        customers = [];
      }
    } else {
      customers = [];
    }
    
    if (!Array.isArray(customers)) {
      customers = [];
    }
    
    customers = customers.map(customer => {
      let adaptedCustomer = {...customer};
      
      if (!adaptedCustomer || typeof adaptedCustomer !== 'object') {
        return {};
      }
      
      if (adaptedCustomer.created_at === undefined && adaptedCustomer.createdAt !== undefined) {
        adaptedCustomer.created_at = adaptedCustomer.createdAt;
      } else if (adaptedCustomer.createdAt === undefined && adaptedCustomer.created_at !== undefined) {
        adaptedCustomer.createdAt = adaptedCustomer.created_at;
      }
      
      if (adaptedCustomer.status === undefined) {
        adaptedCustomer.status = "active";
      }
      
      return adaptedCustomer;
    }).filter(customer => customer && typeof customer === 'object' && Object.keys(customer).length > 0);
    
    originalCustomers = customers;
    allCustomers = [...originalCustomers];
    currentPage = 1;
    
    renderCustomersTable(currentPage);
    
    const tbody = document.getElementById("customerTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            No se encontraron clientes. Puede que necesite agregar un nuevo cliente o revisar su conexión.
          </td>
        </tr>
      `;
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar clientes");
    console.error("Error in listCustomers:", err);
  }
};

// ===== FUNCIONES DE OPERACIONES CRUD CON PROTECCIÓN CLIENTE PREDETERMINADO =====

const registerCustomer = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const nameValid = validateField("name", "El nombre es obligatorio.");
  const lastnameValid = validateField("lastname", "El apellido es obligatorio.");
  const emailValid = validateEmail("email");
  const phoneValid = validatePhone("phone");

  if (!nameValid || !lastnameValid || !emailValid || !phoneValid) {
    return;
  }
  
  const name = document.getElementById("name").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();

  try {
    showLoadingIndicator();
    
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
    
    hideLoadingIndicator();
    
    const data = await res.json();
    
    if (res.status === 201 || res.ok) {
      showSuccess('El cliente ha sido registrado exitosamente');
      closeModal('registerModal');
      
      const customerForm = document.getElementById("customerForm");
      if (customerForm) {
        customerForm.reset();
      }
      
      loadCustomersInternal();
    } else {
      showError(data.message || "No se pudo registrar el cliente.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al registrar cliente. Intente nuevamente.");
    console.error("Error in registerCustomer:", err);
  }
};

const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  try {
    clearValidationErrors('editForm');
    
    showLoadingIndicator();
    
    const res = await fetch(`${API_CUSTOMERS}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    hideLoadingIndicator();

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos del cliente.");
      return;
    }

    const data = await res.json();
    const customer = data.data || data;
    
    // ✅ VALIDACIÓN: Prevenir edición del cliente predeterminado
    if (customer.isDefault) {
      showValidation('El cliente predeterminado no puede ser editado.');
      return;
    }

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
    hideLoadingIndicator();
    showError("Error al cargar el cliente.");
    console.error("Error in fillEditForm:", err);
  }
};

const updateCustomer = async (event) => {
  if (event) {
    event.preventDefault();
  }
  
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const nameValid = validateField("editName", "El nombre es obligatorio.");
  const lastnameValid = validateField("editLastname", "El apellido es obligatorio.");
  const emailValid = validateEmail("editEmail");
  const phoneValid = validatePhone("editPhone");

  if (!nameValid || !lastnameValid || !emailValid || !phoneValid) {
    return;
  }

  const customerId = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const lastname = document.getElementById("editLastname").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const phone = document.getElementById("editPhone").value.trim();

  try {
    showLoadingIndicator();
    
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

    hideLoadingIndicator();
    
    const data = await res.json();

    if (res.ok) {
      showSuccess('El cliente ha sido actualizado exitosamente');
      closeModal("editModal");
      
      const editForm = document.getElementById("editForm");
      if (editForm) {
        editForm.reset();
      }
      
      loadCustomersInternal();
    } else {
      showError(data.message || "No se pudo actualizar el cliente.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al actualizar cliente. Intente nuevamente.");
    console.error("Error in updateCustomer:", err);
  }
};

// ✅ PROTECCIÓN CLIENTE PREDETERMINADO - Estado no se puede cambiar
const updateCustomerStatus = async (id, newStatus) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  // Verificar si es cliente predeterminado ANTES de hacer cualquier cambio
  if (isDefaultCustomer(id) && newStatus === 'inactive') {
    showValidation('El cliente predeterminado no puede ser desactivado porque es utilizado internamente por el sistema.');
    
    // Revertir el switch inmediatamente
    setTimeout(() => {
      const switchElement = document.querySelector(`tr[data-customerid="${id}"] input[type="checkbox"]`);
      if (switchElement) {
        switchElement.checked = true;
      }
    }, 100);
    
    return;
  }

  const switchElement = document.querySelector(`tr[data-customerid="${id}"] input[type="checkbox"]`);

  try {
    showLoadingIndicator();
    
    const res = await fetch(`${API_CUSTOMERS}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    hideLoadingIndicator();
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      data = { message: "Error en formato de respuesta" };
    }

    if (res.ok) {
      showSuccess(`El cliente ha sido ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`);
      
      if (switchElement) {
        switchElement.checked = newStatus === 'active';
      }
      
      // Actualizar el estado en los arrays de clientes
      const customerIndex = allCustomers.findIndex(c => (c.id || c._id) === id);
      if (customerIndex !== -1) {
        allCustomers[customerIndex].status = newStatus;
      }
      
      const originalIndex = originalCustomers.findIndex(c => (c.id || c._id) === id);
      if (originalIndex !== -1) {
        originalCustomers[originalIndex].status = newStatus;
      }
      
    } else {
      let errorMsg = data.message || `Error al ${newStatus === 'active' ? 'activar' : 'desactivar'} el cliente (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
      
      if (switchElement) {
        switchElement.checked = newStatus !== 'active';
      }
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al actualizar estado del cliente. Intente nuevamente.");
    console.error("Error in updateCustomerStatus:", err);
    
    if (switchElement) {
      switchElement.checked = newStatus !== 'active';
    }
  }
};

const deleteCustomer = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
    
  if (isDefaultCustomer(id)) {
    showValidation('El cliente predeterminado no puede ser eliminado del sistema.');
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
    showLoadingIndicator();
    
    const res = await fetch(`${API_CUSTOMERS}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    hideLoadingIndicator();
    
    const data = await res.json();
    
    if (res.ok) {
      showSuccess('El cliente ha sido eliminado exitosamente');
      loadCustomersInternal();
    } else {
      showError(data.message || "No se pudo eliminar el cliente");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al eliminar cliente. Intente nuevamente.");
    console.error("Error in deleteCustomer:", err);
  }
};

const searchCustomer = () => {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalCustomers) return;
  
  if (!term) {
    allCustomers = [...originalCustomers];
  } else {
    allCustomers = originalCustomers.filter(c => {
      const nameMatch = c.name && c.name.toLowerCase().includes(term);
      const lastnameMatch = c.lastname && c.lastname.toLowerCase().includes(term);
      const emailMatch = c.email && c.email.toLowerCase().includes(term);
      const phoneMatch = c.phone && c.phone.toLowerCase().includes(term);
      const idMatch = (c.id || c._id) && (c.id || c._id).toLowerCase().includes(term);
      
      return nameMatch || lastnameMatch || emailMatch || phoneMatch || idMatch;
    });
  }
  
  currentPage = 1;
  renderCustomersTable(currentPage);
};

// ===== FUNCIONES DE UTILIDAD ADICIONALES =====

const checkAuth = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'No autorizado',
        text: 'Debe iniciar sesión para acceder a esta página',
        confirmButtonText: 'Ir a login'
      }).then(() => {
        window.location.href = 'index.html';
      });
    } else {
      alert('Debe iniciar sesión para acceder a esta página');
      window.location.href = 'index.html';
    }
    return false;
  }
  return true;
};

// ===== FUNCIONES DE INICIALIZACIÓN =====

function initializeValidationEvents() {
  disableNativeBrowserValidation();
  setupPhoneNumberValidation();
  
  // Validación en tiempo real - Formulario de registro
  const nameField = document.getElementById("name");
  if (nameField) {
    nameField.addEventListener("blur", () => validateField("name", "El nombre es obligatorio."));
  }
  
  const lastnameField = document.getElementById("lastname");
  if (lastnameField) {
    lastnameField.addEventListener("blur", () => validateField("lastname", "El apellido es obligatorio."));
  }
  
  const emailField = document.getElementById("email");
  if (emailField) {
    emailField.addEventListener("blur", () => validateEmail("email"));
  }
  
  const phoneField = document.getElementById("phone");
  if (phoneField) {
    phoneField.addEventListener("blur", () => validatePhone("phone"));
  }
  
  // Validación en tiempo real - Formulario de edición
  const editNameField = document.getElementById("editName");
  if (editNameField) {
    editNameField.addEventListener("blur", () => validateField("editName", "El nombre es obligatorio."));
  }
  
  const editLastnameField = document.getElementById("editLastname");
  if (editLastnameField) {
    editLastnameField.addEventListener("blur", () => validateField("editLastname", "El apellido es obligatorio."));
  }
  
  const editEmailField = document.getElementById("editEmail");
  if (editEmailField) {
    editEmailField.addEventListener("blur", () => validateEmail("editEmail"));
  }
  
  const editPhoneField = document.getElementById("editPhone");
  if (editPhoneField) {
    editPhoneField.addEventListener("blur", () => validatePhone("editPhone"));
  }
  
  // Configurar formularios
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await updateCustomer(event);
    });
  }
}

function initializeListPage() {
  const customerTableBody = document.getElementById("customerTableBody");
  if (!customerTableBody) {
    console.warn("Elemento customerTableBody no encontrado");
    return;
  }
  
  try {
    listCustomers();
  } catch (err) {
    showError("Error al inicializar la página");
    console.error("Error in initializeListPage:", err);
  }
  
  // Configurar botones y eventos
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
  }
  
  const addUserButton = document.getElementById("addUserButton");
  if (addUserButton) {
    addUserButton.onclick = () => openModal('registerModal');
  }
  
  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.onclick = registerCustomer;
  }
  
  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.addEventListener("click", async () => {
      await updateCustomer();
    });
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchCustomer);
  }
}

// ===== EVENTOS AL CARGAR EL DOM =====

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing...");
  
  if (!checkAuth()) return;
  
  initializeValidationEvents();
  initializeListPage();
});

// ===== FUNCIONES GLOBALES =====

window.validateField = validateField;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.clearValidationErrors = clearValidationErrors;
window.disableNativeBrowserValidation = disableNativeBrowserValidation;
window.isDefaultCustomer = isDefaultCustomer;
window.fillEditForm = fillEditForm;
window.deleteCustomer = deleteCustomer;
window.updateCustomerStatus = updateCustomerStatus;
window.openModal = openModal;
window.closeModal = closeModal;
window.searchCustomer = searchCustomer;
window.updateCustomer = updateCustomer;
window.hideLoadingIndicator = hideLoadingIndicator;
window.showLoadingIndicator = showLoadingIndicator;
window.showError = showError;
window.showSuccess = showSuccess;
window.showInfo = showInfo;
window.showConfirm = showConfirm;
window.showValidation = showValidation;
window.changePage = changePage;
window.renderCustomersTable = renderCustomersTable;