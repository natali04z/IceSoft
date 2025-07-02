const API_SALES = "https://backend-alpha-orpin-58.vercel.app/api/sales";
const API_PRODUCTS = "https://backend-alpha-orpin-58.vercel.app/api/products";
const API_CUSTOMERS = "https://backend-alpha-orpin-58.vercel.app/api/customers";
const API_BRANCHES = "https://backend-alpha-orpin-58.vercel.app/api/branches";

// ===== VARIABLES GLOBALES =====
let allSales = [];
let originalSales = [];
let currentPage = 1;
const rowsPerPage = 10;
let productItems = [];
let productIdToNameMap = {};
let productIdToStockMap = {};
let customerIdToNameMap = {};
let branchIdToNameMap = {};

const isRegisterPage = window.location.pathname.includes('sale-register.html');
const isListPage = !isRegisterPage;

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

// ===== FUNCIONES DE UTILIDAD PARA ALERTAS =====

function hideLoadingIndicator() {
  Swal.close();
}

// ===== FUNCIONES DE VALIDACIÓN =====

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

function validateQuantity(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "La cantidad es obligatoria.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  }
  
  const quantity = parseInt(field.value.trim());
  
  if (isNaN(quantity) || quantity <= 0) {
    errorElement.textContent = "La cantidad debe ser un número entero mayor que cero.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  }
  
  if (quantity > 999999) {
    errorElement.textContent = "La cantidad no puede ser mayor a 999,999.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  }
  
  errorElement.style.display = "none";
  field.classList.remove("input-error");
  return true;
}

// Función para convertir formato colombiano a número
function parseColombianPrice(value) {
  if (!value) return 0;
  
  // Convertir a string si no lo es
  const str = value.toString().trim();
  
  // Remover separadores de miles (puntos) pero mantener decimales (comas)
  // Ejemplo: "3.000,50" -> "3000.50"
  const normalized = str.replace(/\./g, '').replace(',', '.');
  
  return parseFloat(normalized) || 0;
}

// Función para formatear con puntos directamente
function addThousandsSeparators(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Función para formatear entrada de precio en tiempo real
function formatPriceInput(field) {
  // Permitir números y puntos, eliminar todo lo demás
  let value = field.value.replace(/[^\d.]/g, '');
  
  // Remover todos los puntos y usar solo números
  value = value.replace(/\./g, '');
  
  if (value === '') {
    field.value = '';
    return;
  }
  
  // Formatear con puntos directamente
  const formatted = addThousandsSeparators(value);
  field.value = formatted;
}

// Función para formatear mientras escribe
function formatPriceOnInput(field) {
  // Guardar posición del cursor
  const cursorPosition = field.selectionStart;
  const oldValue = field.value;
  
  // Permitir números y puntos, eliminar todo lo demás
  let value = field.value.replace(/[^\d.]/g, '');
  
  // Remover todos los puntos y usar solo números
  value = value.replace(/\./g, '');
  
  if (value === '') {
    field.value = '';
    return;
  }
  
  // Formatear con puntos directamente
  const formatted = addThousandsSeparators(value);
  field.value = formatted;
  
  // Ajustar posición del cursor de manera más inteligente
  const pointsInOld = (oldValue.match(/\./g) || []).length;
  const pointsInNew = (formatted.match(/\./g) || []).length;
  const pointDiff = pointsInNew - pointsInOld;
  
  let newPosition = cursorPosition + pointDiff;
  if (newPosition < 0) newPosition = 0;
  if (newPosition > formatted.length) newPosition = formatted.length;
  
  field.setSelectionRange(newPosition, newPosition);
}

function validatePrice(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El precio es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  }
  
  const price = parseColombianPrice(field.value.trim());
  
  if (isNaN(price) || price <= 0) {
    errorElement.textContent = "El precio debe ser un número mayor que cero.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  }
  
  if (price > 999999999) {
    errorElement.textContent = "El precio no puede ser mayor a $999,999,999.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  }
  
  errorElement.style.display = "none";
  field.classList.remove("input-error");
  return true;
}

function validateCustomer(fieldId) {
  // Obtener valor del selector (personalizado o nativo)
  let fieldValue = '';
  const field = document.getElementById(fieldId);
  
  if (customCustomerSelector && isRegisterPage) {
    fieldValue = customCustomerSelector.getValue();
  } else if (field) {
    fieldValue = field.value;
  }
  
  const errorElement = document.getElementById(`${fieldId}-error`);
  const inputElement = customCustomerSelector ? 
    document.getElementById('customerSearch') : field;
  
  if (!fieldValue) {
    errorElement.textContent = "Debe seleccionar un cliente.";
    errorElement.style.display = "block";
    if (inputElement) inputElement.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    if (inputElement) inputElement.classList.remove("input-error");
    return true;
  }
}

function validateBranch(fieldId) {
  // Obtener valor del selector (personalizado o nativo)
  let fieldValue = '';
  const field = document.getElementById(fieldId);
  
  if (customBranchSelector && isRegisterPage) {
    fieldValue = customBranchSelector.getValue();
  } else if (field) {
    fieldValue = field.value;
  }
  
  const errorElement = document.getElementById(`${fieldId}-error`);
  const inputElement = customBranchSelector ? 
    document.getElementById('branchSearch') : field;
  
  if (!fieldValue) {
    errorElement.textContent = "Debe seleccionar una sucursal.";
    errorElement.style.display = "block";
    if (inputElement) inputElement.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    if (inputElement) inputElement.classList.remove("input-error");
    return true;
  }
}

function validateProduct(fieldId) {
  // Obtener valor del selector (personalizado o nativo)
  let fieldValue = '';
  const field = document.getElementById(fieldId);
  
  if (customProductSelector && isRegisterPage) {
    fieldValue = customProductSelector.getValue();
  } else if (field) {
    fieldValue = field.value;
  }
  
  const errorElement = document.getElementById(`${fieldId}-error`);
  const inputElement = customProductSelector ? 
    document.getElementById('productSearch') : field;
  
  if (!fieldValue) {
    errorElement.textContent = "Debe seleccionar un producto.";
    errorElement.style.display = "block";
    if (inputElement) inputElement.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    if (inputElement) inputElement.classList.remove("input-error");
    return true;
  }
}

function validateDate(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "La fecha es obligatoria.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

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

function disableNativeBrowserValidation() {
  const saleForm = document.getElementById("saleForm");
  if (saleForm) {
    saleForm.setAttribute("novalidate", "");
    const inputs = saleForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
  
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.setAttribute("novalidate", "");
    const inputs = editForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
}

// ===== FUNCIONES DE UTILIDAD =====

function getUserPermissions() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return ['edit_sales', 'delete_sales', 'update_status_sales'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['edit_sales', 'delete_sales', 'update_status_sales'];
  } catch (error) {
    return ['edit_sales', 'delete_sales', 'update_status_sales'];
  }
}

function isNumber(evt, allowDecimals = false) {
  const charCode = (evt.which) ? evt.which : evt.keyCode;
  
  // Permitir teclas de control (backspace, delete, tab, escape, enter)
  if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1 ||
    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    (charCode === 65 && evt.ctrlKey === true) ||
    (charCode === 67 && evt.ctrlKey === true) ||
    (charCode === 86 && evt.ctrlKey === true) ||
    (charCode === 88 && evt.ctrlKey === true) ||
    // Permitir home, end, left, right
    (charCode >= 35 && charCode <= 39)) {
    return true;
  }
  
  // Solo permitir números
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    return false;
  }
  
  return true;
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = "flex";
  
  if (modalId === 'registerModal') {
    clearValidationErrors('saleForm');
    
    const saleForm = document.getElementById("saleForm");
    if (saleForm) {
      saleForm.reset();
    }
    
    productItems = [];
    updateProductItemsList();
    
    // ✅ NUEVA IMPLEMENTACIÓN - fecha local sin conversión UTC
    const salesDateElement = document.getElementById("salesDate");
    if (salesDateElement) {
      const todayLocal = getTodayLocal();
      salesDateElement.value = todayLocal;
    }
    
    // Ocultar la información de stock
    const stockInfo = document.getElementById("stockInfo");
    if (stockInfo) {
      stockInfo.style.display = "none";
    }
    
    // Resetear selectores personalizados si existen
    if (customCustomerSelector) customCustomerSelector.reset();
    if (customBranchSelector) customBranchSelector.reset();
    if (customProductSelector) customProductSelector.reset();
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = "none";
}

function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire({
      icon: 'error',
      title: 'No autorizado',
      text: 'Debe iniciar sesión para acceder a esta página',
      confirmButtonText: 'Ir a login'
    }).then(() => {
      window.location.href = 'index.html';
    });
    return false;
  }
  return true;
}

// ===== FUNCIONES DE FORMATEO =====

// ✅ NUEVA IMPLEMENTACIÓN - usando la función helper para DD/MM/YYYY
const formatDate = (dateString) => {
  return formatDateForDisplay(dateString);
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "$0";
  
  const num = parseFloat(amount);
  if (isNaN(num)) return "$0";
  
  // Si es un número entero, no mostrar decimales
  if (num % 1 === 0) {
    return `$${Math.round(num).toLocaleString('es-CO')}`;
  } else {
    // Si tiene decimales, mostrar máximo 2 decimales
    return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

const getProductNameById = (productId) => {
  if (!productId) return "Producto desconocido";
  return productIdToNameMap[productId] || "Producto no encontrado";
};

const getCustomerNameById = (customerId) => {
  if (!customerId) return "Cliente desconocido";
  return customerIdToNameMap[customerId] || "Cliente no encontrado";
};

const getBranchNameById = (branchId) => {
  if (!branchId) return "Sucursal desconocida";
  return branchIdToNameMap[branchId] || "Sucursal no encontrada";
};

const getStatusBadge = (status) => {
  const badges = {
    'processing': '<span class="status-badge processing">Procesando</span>',
    'completed': '<span class="status-badge completed">Completada</span>',
    'cancelled': '<span class="status-badge cancelled">Cancelada</span>'
  };
  return badges[status] || '<span class="status-badge processing">Procesando</span>';
};

// ===== CLASES DE SELECTORES PERSONALIZADOS =====

// Instancias globales de los selectores personalizados
let customCustomerSelector = null;
let customBranchSelector = null;
let customProductSelector = null;

// Clase para manejar el selector personalizado de clientes
class CustomCustomerSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById('customerSearch');
    this.hiddenInput = document.getElementById('customer');
    this.dropdown = document.getElementById('customerDropdown');
    this.searchInput = document.getElementById('customerSearchInput');
    this.optionsContainer = document.getElementById('customerOptions');
    this.customers = [];
    this.filteredCustomers = [];
    this.selectedCustomer = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Event listeners
    this.input.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.filterCustomers(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setCustomers(customers) {
    this.customers = customers.map(customer => ({
      id: customer._id || customer.id,
      name: customer.name || 'Sin nombre',
      email: customer.email || 'Sin email'
    }));
    this.filteredCustomers = [...this.customers];
    this.renderOptions();
  }

  filterCustomers(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = this.customers.filter(customer => 
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      );
    }
    
    this.renderOptions();
  }

  renderOptions() {
    if (this.filteredCustomers.length === 0) {
      this.optionsContainer.innerHTML = '<div class="custom-select-no-results">No se encontraron clientes</div>';
      return;
    }

    const optionsHTML = this.filteredCustomers.map(customer => 
      `<div class="custom-select-option" data-id="${customer.id}">
        ${customer.name}
      </div>`
    ).join('');

    this.optionsContainer.innerHTML = optionsHTML;

    // Agregar event listeners a las opciones
    this.optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => this.selectOption(option));
    });
  }

  selectOption(optionElement) {
    const customerId = optionElement.dataset.id;
    const customerName = optionElement.textContent.trim();

    // Actualizar valores
    this.selectedCustomer = { id: customerId, name: customerName };
    this.input.value = customerName;
    this.hiddenInput.value = customerId;

    // Limpiar validación
    this.clearValidation();

    // Cerrar dropdown
    this.close();

    // Disparar evento de cambio para compatibilidad con código existente
    const changeEvent = new Event('change', { bubbles: true });
    this.hiddenInput.dispatchEvent(changeEvent);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('open');
    this.searchInput.value = '';
    this.filteredCustomers = [...this.customers];
    this.renderOptions();
    
    // Enfocar en el input de búsqueda
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('open');
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  clearValidation() {
    const errorElement = document.getElementById('customer-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.input.classList.remove('input-error');
  }

  reset() {
    this.selectedCustomer = null;
    this.input.value = '';
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    // Asegurar que this.customers sea un array válido antes de copiar
    if (Array.isArray(this.customers)) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = [];
    }
    this.renderOptions();
    this.close();
  }

  getValue() {
    return this.hiddenInput.value;
  }

  getSelectedCustomer() {
    return this.selectedCustomer;
  }
}

// Clase para manejar el selector personalizado de sucursales
class CustomBranchSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById('branchSearch');
    this.hiddenInput = document.getElementById('branch');
    this.dropdown = document.getElementById('branchDropdown');
    this.searchInput = document.getElementById('branchSearchInput');
    this.optionsContainer = document.getElementById('branchOptions');
    this.branches = [];
    this.filteredBranches = [];
    this.selectedBranch = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Event listeners
    this.input.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.filterBranches(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setBranches(branches) {
    this.branches = branches.map(branch => ({
      id: branch._id || branch.id,
      name: branch.name || 'Sin nombre',
      location: branch.location || 'Sin ubicación'
    }));
    this.filteredBranches = [...this.branches];
    this.renderOptions();
  }

  filterBranches(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredBranches = [...this.branches];
    } else {
      this.filteredBranches = this.branches.filter(branch => 
        branch.name.toLowerCase().includes(term) ||
        branch.location.toLowerCase().includes(term)
      );
    }
    
    this.renderOptions();
  }

  renderOptions() {
    if (this.filteredBranches.length === 0) {
      this.optionsContainer.innerHTML = '<div class="custom-select-no-results">No se encontraron sucursales</div>';
      return;
    }

    const optionsHTML = this.filteredBranches.map(branch => 
      `<div class="custom-select-option" data-id="${branch.id}">
        ${branch.name}
      </div>`
    ).join('');

    this.optionsContainer.innerHTML = optionsHTML;

    // Agregar event listeners a las opciones
    this.optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => this.selectOption(option));
    });
  }

  selectOption(optionElement) {
    const branchId = optionElement.dataset.id;
    const branchName = optionElement.textContent.trim();

    // Actualizar valores
    this.selectedBranch = { id: branchId, name: branchName };
    this.input.value = branchName;
    this.hiddenInput.value = branchId;

    // Limpiar validación
    this.clearValidation();

    // Cerrar dropdown
    this.close();

    // Disparar evento de cambio para compatibilidad con código existente
    const changeEvent = new Event('change', { bubbles: true });
    this.hiddenInput.dispatchEvent(changeEvent);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('open');
    this.searchInput.value = '';
    this.filteredBranches = [...this.branches];
    this.renderOptions();
    
    // Enfocar en el input de búsqueda
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('open');
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  clearValidation() {
    const errorElement = document.getElementById('branch-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.input.classList.remove('input-error');
  }

  reset() {
    this.selectedBranch = null;
    this.input.value = '';
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    // Asegurar que this.branches sea un array válido antes de copiar
    if (Array.isArray(this.branches)) {
      this.filteredBranches = [...this.branches];
    } else {
      this.filteredBranches = [];
    }
    this.renderOptions();
    this.close();
  }

  getValue() {
    return this.hiddenInput.value;
  }

  getSelectedBranch() {
    return this.selectedBranch;
  }
}

// Clase para manejar el selector personalizado de productos (para ventas)
class CustomSaleProductSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById('productSearch');
    this.hiddenInput = document.getElementById('product');
    this.dropdown = document.getElementById('productDropdown');
    this.searchInput = document.getElementById('productSearchInput');
    this.optionsContainer = document.getElementById('productOptions');
    this.products = [];
    this.filteredProducts = [];
    this.selectedProduct = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Event listeners
    this.input.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.filterProducts(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setProducts(products) {
    this.products = products.map(product => ({
      id: product._id || product.id,
      name: product.name || 'Sin nombre',
      price: product.price || 0,
      stock: product.stock || 0
    }));
    this.filteredProducts = [...this.products];
    this.renderOptions();
  }

  filterProducts(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(product => 
        product.name.toLowerCase().includes(term)
      );
    }
    
    this.renderOptions();
  }

  renderOptions() {
    if (this.filteredProducts.length === 0) {
      this.optionsContainer.innerHTML = '<div class="custom-select-no-results">No se encontraron productos</div>';
      return;
    }

    const optionsHTML = this.filteredProducts.map(product => 
      `<div class="custom-select-option" data-id="${product.id}" data-price="${product.price}" data-stock="${product.stock}">
        ${product.name}
      </div>`
    ).join('');

    this.optionsContainer.innerHTML = optionsHTML;

    // Agregar event listeners a las opciones
    this.optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => this.selectOption(option));
    });
  }

  selectOption(optionElement) {
    const productId = optionElement.dataset.id;
    const productName = optionElement.textContent.trim();
    const productPrice = optionElement.dataset.price;
    const productStock = optionElement.dataset.stock;

    // Actualizar valores
    this.selectedProduct = { 
      id: productId, 
      name: productName, 
      price: productPrice,
      stock: productStock 
    };
    this.input.value = productName;
    this.hiddenInput.value = productId;

    // Actualizar el campo de precio de venta
    const salePriceInput = document.getElementById('salePrice');
    if (salePriceInput && productPrice && productPrice !== "0") {
      salePriceInput.value = parseFloat(productPrice);
      // Validar el precio después de actualizarlo
      if (window.validatePrice) {
        window.validatePrice('salePrice');
      }
    }

    // Limpiar validación
    this.clearValidation();

    // Cerrar dropdown
    this.close();

    // Disparar evento de cambio para compatibilidad con código existente
    const changeEvent = new Event('change', { bubbles: true });
    this.hiddenInput.dispatchEvent(changeEvent);

    // Actualizar total del producto
    if (window.updateProductTotal) {
      window.updateProductTotal();
    }

    // Mostrar stock si existe la función
    if (window.showProductStock) {
      window.showProductStock();
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('open');
    this.searchInput.value = '';
    this.filteredProducts = [...this.products];
    this.renderOptions();
    
    // Enfocar en el input de búsqueda
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('open');
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  clearValidation() {
    const errorElement = document.getElementById('product-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.input.classList.remove('input-error');
  }

  reset() {
    this.selectedProduct = null;
    this.input.value = '';
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    // Asegurar que this.products sea un array válido antes de copiar
    if (Array.isArray(this.products)) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = [];
    }
    this.renderOptions();
    this.close();
  }

  getValue() {
    return this.hiddenInput.value;
  }

  getSelectedProduct() {
    return this.selectedProduct;
  }
}

const getValidStatusOptions = (currentStatus) => {
  const statusConfig = {
    'processing': ['processing', 'completed', 'cancelled'],
    'completed': ['completed'],
    'cancelled': ['cancelled']
  };
  
  return statusConfig[currentStatus] || ['processing', 'completed', 'cancelled'];
};

// ===== FUNCIONES DE CARGA DE DATOS =====

const loadSalesInternal = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_SALES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo listar las ventas.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      showError("Error al listar las ventas.");
      return;
    }
    
    if (data && typeof data === 'object' && data.sales) {
      originalSales = data.sales;
    } 
    else if (Array.isArray(data)) {
      originalSales = data;
    }
    else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        originalSales = data[arrayProps[0]];
      } else {
        originalSales = [];
      }
    } else {
      originalSales = [];
    }
    
    if (!Array.isArray(originalSales)) {
      originalSales = [];
    }
    
    originalSales = originalSales.map(sale => {
      let adaptedSale = {...sale};
   
      if (!adaptedSale || typeof adaptedSale !== 'object') {
        return {};
      }
      
      if (adaptedSale.status === undefined && adaptedSale.estado !== undefined) {
        adaptedSale.status = adaptedSale.estado;
      } else if (adaptedSale.estado === undefined && adaptedSale.status !== undefined) {
        adaptedSale.estado = adaptedSale.status;
      }
      
      // ✅ NUEVA IMPLEMENTACIÓN - normalizar fechas usando las funciones helper
      if (adaptedSale.sales_date === undefined && adaptedSale.fecha_venta !== undefined) {
        adaptedSale.sales_date = adaptedSale.fecha_venta;
      } else if (adaptedSale.fecha_venta === undefined && adaptedSale.sales_date !== undefined) {
        adaptedSale.fecha_venta = adaptedSale.sales_date;
      } else if (adaptedSale.sales_date === undefined && adaptedSale.fecha_venta === undefined && adaptedSale.salesDate !== undefined) {
        adaptedSale.sales_date = adaptedSale.salesDate;
        adaptedSale.fecha_venta = adaptedSale.salesDate;
      }
      
      if (adaptedSale.products === undefined && adaptedSale.productos !== undefined) {
        adaptedSale.products = adaptedSale.productos.map(item => ({
          product: item.producto,
          quantity: item.cantidad,
          sale_price: item.precio_venta,
          total: item.total
        }));
      } else if (adaptedSale.productos === undefined && adaptedSale.products !== undefined) {
        adaptedSale.productos = adaptedSale.products.map(item => ({
          producto: item.product,
          cantidad: item.quantity,
          precio_venta: item.sale_price,
          total: item.total
        }));
      }
      
      if (adaptedSale.customer === undefined && adaptedSale.cliente !== undefined) {
        adaptedSale.customer = adaptedSale.cliente;
      } else if (adaptedSale.cliente === undefined && adaptedSale.customer !== undefined) {
        adaptedSale.cliente = adaptedSale.customer;
      }
      
      if (adaptedSale.status === undefined && adaptedSale.estado === undefined) {
        adaptedSale.status = "processing";
        adaptedSale.estado = "processing";
      }
      
      if (adaptedSale.status === "pending") {
        adaptedSale.status = "processing";
        adaptedSale.estado = "processing";
      }
      
      adaptedSale.formattedTotal = formatCurrency(adaptedSale.total);
      
      return adaptedSale;
    }).filter(sale => sale && typeof sale === 'object' && Object.keys(sale).length > 0);
    
    allSales = [...originalSales];
    currentPage = 1;
    
    await loadProducts();
    await loadCustomers();
    await loadBranches();
    
    renderSalesTable(currentPage);
    
    const tbody = document.getElementById("salesTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            No se encontraron ventas. Puede que necesite agregar una nueva venta o revisar su conexión.
          </td>
        </tr>
      `;
    }
  } catch (err) {
    showError("Error al listar las ventas");
  }
};

const listSales = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    showLoadingIndicator();
    
    const res = await fetch(API_SALES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    hideLoadingIndicator();

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo listar las ventas.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      hideLoadingIndicator();
      showError("Error al listar las ventas.");
      return;
    }
    
    if (data && typeof data === 'object' && data.sales) {
      originalSales = data.sales;
    } 
    else if (Array.isArray(data)) {
      originalSales = data;
    }
    else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        originalSales = data[arrayProps[0]];
      } else {
        originalSales = [];
      }
    } else {
      originalSales = [];
    }
    
    if (!Array.isArray(originalSales)) {
      originalSales = [];
    }
    
    originalSales = originalSales.map(sale => {
      let adaptedSale = {...sale};
   
      if (!adaptedSale || typeof adaptedSale !== 'object') {
        return {};
      }
      
      if (adaptedSale.status === undefined && adaptedSale.estado !== undefined) {
        adaptedSale.status = adaptedSale.estado;
      } else if (adaptedSale.estado === undefined && adaptedSale.status !== undefined) {
        adaptedSale.estado = adaptedSale.status;
      }
      
      // ✅ NUEVA IMPLEMENTACIÓN - normalizar fechas
      if (adaptedSale.sales_date === undefined && adaptedSale.fecha_venta !== undefined) {
        adaptedSale.sales_date = adaptedSale.fecha_venta;
      } else if (adaptedSale.fecha_venta === undefined && adaptedSale.sales_date !== undefined) {
        adaptedSale.fecha_venta = adaptedSale.sales_date;
      } else if (adaptedSale.sales_date === undefined && adaptedSale.fecha_venta === undefined && adaptedSale.salesDate !== undefined) {
        adaptedSale.sales_date = adaptedSale.salesDate;
        adaptedSale.fecha_venta = adaptedSale.salesDate;
      }
      
      if (adaptedSale.products === undefined && adaptedSale.productos !== undefined) {
        adaptedSale.products = adaptedSale.productos.map(item => ({
          product: item.producto,
          quantity: item.cantidad,
          sale_price: item.precio_venta,
          total: item.total
        }));
      } else if (adaptedSale.productos === undefined && adaptedSale.products !== undefined) {
        adaptedSale.productos = adaptedSale.products.map(item => ({
          producto: item.product,
          cantidad: item.quantity,
          precio_venta: item.sale_price,
          total: item.total
        }));
      }
      
      if (adaptedSale.customer === undefined && adaptedSale.cliente !== undefined) {
        adaptedSale.customer = adaptedSale.cliente;
      } else if (adaptedSale.cliente === undefined && adaptedSale.customer !== undefined) {
        adaptedSale.cliente = adaptedSale.customer;
      }
      
      if (adaptedSale.status === undefined && adaptedSale.estado === undefined) {
        adaptedSale.status = "processing";
        adaptedSale.estado = "processing";
      }
      
      if (adaptedSale.status === "pending") {
        adaptedSale.status = "processing";
        adaptedSale.estado = "processing";
      }
      
      adaptedSale.formattedTotal = formatCurrency(adaptedSale.total);
      
      return adaptedSale;
    }).filter(sale => sale && typeof sale === 'object' && Object.keys(sale).length > 0);
    
    allSales = [...originalSales];
    currentPage = 1;
    
    await loadProducts();
    await loadCustomers();
    await loadBranches();
    
    renderSalesTable(currentPage);
    
    const tbody = document.getElementById("salesTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            No se encontraron ventas. Puede que necesite agregar una nueva venta o revisar su conexión.
          </td>
        </tr>
      `;
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar las ventas");
  }
};

const loadProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_PRODUCTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError("No se pudo listar los productos.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      return;
    }
    
    let products = [];
    
    if (data && typeof data === 'object' && data.products) {
      products = data.products;
    } else if (Array.isArray(data)) {
      products = data;
    } else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        products = data[arrayProps[0]];
      }
    }
    
    if (!Array.isArray(products)) {
      products = [];
    }
    
    const productSelect = document.getElementById("product");
    const editProductSelect = document.getElementById("editProduct");
    
    if (productSelect) {
      productSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar producto</option>`;
    }
    
    if (editProductSelect) {
      editProductSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar producto</option>`;
    }
    
    productIdToNameMap = {};
    productIdToStockMap = {};
    products.forEach(prod => {
      if (!prod || typeof prod !== 'object') return;
      
      const productId = prod._id;
      const productName = prod.name || 'Sin nombre';
      const productPrice = prod.price || 0;
      const productStock = prod.stock || prod.quantity || 0;
      
      if (productId) {
        productIdToNameMap[productId] = productName;
        productIdToStockMap[productId] = productStock;
        
        const option = `<option value="${productId}" data-price="${productPrice}" data-stock="${productStock}">${productName}</option>`;
        if (productSelect) productSelect.innerHTML += option;
        if (editProductSelect) editProductSelect.innerHTML += option;
      }
    });
    
    // Inicializar selector personalizado si estamos en la página de registro
    if (isRegisterPage && document.getElementById('productSelectContainer')) {
      customProductSelector = new CustomSaleProductSelector('productSelectContainer');
      customProductSelector.setProducts(products);
    }
    
    if (productSelect) {
      productSelect.addEventListener('change', function() {
        // Solo ejecutar si no estamos usando el selector personalizado
        if (!customProductSelector || !isRegisterPage) {
          const selectedOption = this.options && this.options[this.selectedIndex];
          const price = selectedOption ? selectedOption.getAttribute('data-price') : null;
          const salePriceInput = document.getElementById('salePrice');
          
          if (salePriceInput && price) {
            salePriceInput.value = parseFloat(price);
            updateProductTotal();
            validatePrice('salePrice');
          }
          
          // Mostrar el stock del producto seleccionado
          showProductStock();
        }
      });
    }
    
    if (editProductSelect) {
      editProductSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        const editSalePriceInput = document.getElementById('editSalePrice');
        
        if (editSalePriceInput && price) {
          editSalePriceInput.value = parseFloat(price);
        }
      });
    }
    
  } catch (err) {
    showError("Error al listar los productos");
  }
};

const loadCustomers = async () => {
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
      showError("No se pudo listar los clientes: " + (data.message || "Error desconocido"));
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      showError("Error al procesar la respuesta de clientes");
      return;
    }
    
    let customers = [];
    
    if (data && typeof data === 'object' && data.customers) {
      customers = data.customers;
    } else if (data && typeof data === 'object' && data.data) {
      customers = data.data;
    } else if (Array.isArray(data)) {
      customers = data;
    } else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        customers = data[arrayProps[0]];
      }
    }
    
    if (!Array.isArray(customers)) {
      customers = [];
    }
    
    const customerSelect = document.getElementById("customer");
    const editCustomerSelect = document.getElementById("editCustomer");
    
    if (customerSelect) {
      customerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar cliente</option>`;
    }
    
    if (editCustomerSelect) {
      editCustomerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar cliente</option>`;
    }
    
    customerIdToNameMap = {};
    
    if (customers.length === 0) {
      if (customerSelect) {
        customerSelect.innerHTML += `<option value="" disabled>No hay clientes disponibles</option>`;
      }
      if (editCustomerSelect) {
        editCustomerSelect.innerHTML += `<option value="" disabled>No hay clientes disponibles</option>`;
      }
      return;
    }
    
    customers.forEach(cust => {
      if (!cust || typeof cust !== 'object') {
        return;
      }
      
      const customerId = cust._id || cust.id;
      const firstName = cust.name || cust.nombre || '';
      const lastName = cust.lastname || cust.apellido || cust.last_name || '';
      const customerName = `${firstName} ${lastName}`.trim() || 'Sin nombre';
      
      if (customerId) {
        customerIdToNameMap[customerId] = customerName;
        
        const option = `<option value="${customerId}">${customerName}</option>`;
        if (customerSelect) customerSelect.innerHTML += option;
        if (editCustomerSelect) editCustomerSelect.innerHTML += option;
      }
    });
    
    // Inicializar selector personalizado si estamos en la página de registro
    if (isRegisterPage && document.getElementById('customerSelectContainer')) {
      customCustomerSelector = new CustomCustomerSelector('customerSelectContainer');
      customCustomerSelector.setCustomers(customers);
    }
    
  } catch (err) {
    showError("Error al listar los clientes: " + (err.message || err));
  }
};

const loadBranches = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_BRANCHES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError("No se pudo listar las sucursales: " + (data.message || "Error desconocido"));
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      showError("Error al procesar la respuesta de sucursales");
      return;
    }
    
    let branches = [];
    
    if (data && typeof data === 'object' && data.branches) {
      branches = data.branches;
    } else if (data && typeof data === 'object' && data.success && data.branches) {
      branches = data.branches;
    } else if (Array.isArray(data)) {
      branches = data;
    } else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        branches = data[arrayProps[0]];
      }
    }
    
    if (!Array.isArray(branches)) {
      branches = [];
    }
    
    const branchSelect = document.getElementById("branch");
    const editBranchSelect = document.getElementById("editBranch");
    
    if (branchSelect) {
      branchSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar sucursal</option>`;
    }
    
    if (editBranchSelect) {
      editBranchSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar sucursal</option>`;
    }
    
    branchIdToNameMap = {};
    
    if (branches.length === 0) {
      if (branchSelect) {
        branchSelect.innerHTML += `<option value="" disabled>No hay sucursales disponibles</option>`;
      }
      if (editBranchSelect) {
        editBranchSelect.innerHTML += `<option value="" disabled>No hay sucursales disponibles</option>`;
      }
      return;
    }
    
    branches.forEach(branch => {
      if (!branch || typeof branch !== 'object') {
        return;
      }
      
      const branchId = branch._id || branch.id;
      const branchName = branch.name || 'Sin nombre';
      const branchAddress = branch.address || '';
      const displayName = branchAddress ? `${branchName} - ${branchAddress}` : branchName;
      
      if (branchId && branch.status === 'active') {
        branchIdToNameMap[branchId] = displayName;
        
        const option = `<option value="${branchId}">${displayName}</option>`;
        if (branchSelect) branchSelect.innerHTML += option;
        if (editBranchSelect) editBranchSelect.innerHTML += option;
      }
    });
    
    // Inicializar selector personalizado si estamos en la página de registro
    if (isRegisterPage && document.getElementById('branchSelectContainer')) {
      customBranchSelector = new CustomBranchSelector('branchSelectContainer');
      customBranchSelector.setBranches(branches);
    }
    
  } catch (err) {
    showError("Error al listar las sucursales: " + (err.message || err));
  }
};

// ===== FUNCIONES DE RENDERIZADO =====

const renderSalesTable = (page = 1) => {
  const tbody = document.getElementById("salesTableBody");
  
  if (!tbody) {
    return;
  }
  
  tbody.innerHTML = "";

  if (!allSales || allSales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          No hay ventas disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const salesToShow = allSales.slice(start, end);

  const userPermissions = getUserPermissions();
  const canUpdateStatus = userPermissions.includes("update_status_sales");
  const canDeleteSales = userPermissions.includes("delete_sales");
  
  let tableContent = '';

  salesToShow.forEach((sale, index) => {
    try {
      const saleId = sale._id || "";
      const displayId = sale.id || saleId || `Vt${String(index + 1).padStart(2, '0')}`;
      
      let customerName = "Sin Cliente";
      if (sale.customer) {
        if (typeof sale.customer === 'object' && sale.customer.name) {
          customerName = `${sale.customer.name} ${sale.customer.lastname || ''}`.trim();
        } else {
          customerName = getCustomerNameById(sale.customer);
        }
      } else if (sale.cliente) {
        if (typeof sale.cliente === 'object' && sale.cliente.name) {
          customerName = `${sale.cliente.name} ${sale.cliente.lastname || ''}`.trim();
        } else {
          customerName = getCustomerNameById(sale.cliente);
        }
      }
      
      let branchName = "Sin Sucursal";
      if (sale.branch) {
        if (typeof sale.branch === 'object' && sale.branch.name) {
          branchName = sale.branch.address ? `${sale.branch.name} - ${sale.branch.address}` : sale.branch.name;
        } else {
          branchName = getBranchNameById(sale.branch);
        }
      }
      
      const salesDate = sale.sales_date || sale.fecha_venta || sale.salesDate;
      const status = sale.status || sale.estado || "processing";
      const formattedTotal = sale.formattedTotal || formatCurrency(sale.total);
      
      const validStatuses = getValidStatusOptions(status);
      
      let statusOptions = '';
      validStatuses.forEach(validStatus => {
        const selected = status === validStatus ? 'selected' : '';
        const statusLabels = {
          'processing': 'Procesando',
          'completed': 'Completada',
          'cancelled': 'Cancelada'
        };
        statusOptions += `<option value="${validStatus}" ${selected}>${statusLabels[validStatus]}</option>`;
      });
      
      const canDelete = canDeleteSales && ["processing", "cancelled"].includes(status);
      
      let statusElement;
      if (status === 'processing' && canUpdateStatus) {
        statusElement = `
          <select onchange="updateSaleStatus('${saleId}', this.value)" 
                  class="status-select processing">
            ${statusOptions}
          </select>
        `;
      } else {
        statusElement = getStatusBadge(status);
      }
      
      tableContent += `
        <tr data-id="${saleId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${customerName}</td>
          <td>${branchName}</td>
          <td>${formatDate(salesDate)}</td>
          <td>${formattedTotal}</td>
          <td class="status-column">
            ${statusElement}
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="viewSaleDetails('${saleId}')" class="icon-button view-button" title="Ver detalles">
                <i class="material-icons">visibility</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="7" class="text-center text-danger">
            Error al renderizar esta venta: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  renderPaginationControls();
};

const renderPaginationControls = () => {
  if (!allSales || allSales.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allSales.length / rowsPerPage);
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
    const startItem = allSales.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allSales.length);
    info.innerHTML = `${startItem}-${endItem} de ${allSales.length}`;
  }
};

const changePage = (page) => {
  currentPage = page;
  renderSalesTable(currentPage);
};

// ===== FUNCIONES DE GESTIÓN DE PRODUCTOS =====

const addProductItem = () => {
  const quantityInput = document.getElementById("quantity");
  const salePriceInput = document.getElementById("salePrice");
  
  if (!quantityInput || !salePriceInput) {
    showError("Error: No se pudieron encontrar los campos del formulario");
    return;
  }
  
  const productValid = validateProduct("product");
  const quantityValid = validateQuantity("quantity");
  const priceValid = validatePrice("salePrice");
  
  if (!productValid || !quantityValid || !priceValid) {
    return;
  }
  
  // Obtener datos del producto (selector personalizado o nativo)
  let productId = '';
  let productName = '';
  
  if (customProductSelector && isRegisterPage) {
    productId = customProductSelector.getValue();
    const selectedProduct = customProductSelector.getSelectedProduct();
    productName = selectedProduct ? selectedProduct.name : 'Sin nombre';
  } else {
    const productSelect = document.getElementById("product");
    if (!productSelect) {
      showError("Error: No se pudo encontrar el selector de producto");
      return;
    }
    productId = productSelect.value;
    productName = productSelect.options[productSelect.selectedIndex].text;
  }
  
  const quantity = parseInt(quantityInput.value);
  const salePrice = parseColombianPrice(salePriceInput.value);
  
  if (quantity <= 0) {
    showError("La cantidad debe ser mayor que cero");
    return;
  }
  
  if (salePrice <= 0) {
    showError("El precio debe ser mayor que cero");
    return;
  }
  
  const total = quantity * salePrice;
  
  // Verificar si el producto ya está en la lista
  const existingProductIndex = productItems.findIndex(item => item.product === productId);
  
  if (existingProductIndex >= 0) {
    // Si ya existe, actualizar cantidad y totales
    productItems[existingProductIndex].quantity += quantity;
    productItems[existingProductIndex].total = productItems[existingProductIndex].quantity * productItems[existingProductIndex].sale_price;
    
    showSuccess("Producto actualizado en la lista");
  } else {
    // Si no existe, agregarlo
    productItems.push({
      product: productId,
      quantity: quantity,
      sale_price: salePrice,
      total: total,
      name: productName
    });
    
    showSuccess("Producto agregado a la lista");
  }
  
  updateProductItemsList();
  
  // Limpiar formulario
  if (customProductSelector && isRegisterPage) {
    customProductSelector.reset();
  } else {
    const productSelect = document.getElementById("product");
    if (productSelect) {
      productSelect.selectedIndex = 0;
    }
  }
  
  quantityInput.value = "1";
  salePriceInput.value = "";
  document.getElementById("product-total").textContent = formatCurrency(0);
  
  // Ocultar la información de stock al limpiar el formulario
  const stockInfo = document.getElementById("stockInfo");
  if (stockInfo) {
    stockInfo.style.display = "none";
  }
  
  // Ocultar errores de validación de la lista de productos
  const productListError = document.getElementById("productItemsList-error");
  if (productListError) {
    productListError.style.display = "none";
  }
  
  updateTotalAmount();
};

const removeProductItem = (index) => {
  productItems.splice(index, 1);
  updateProductItemsList();
  updateTotalAmount();
};

const updateTotalAmount = () => {
  const totalAmountElement = document.getElementById("totalAmount");
  if (!totalAmountElement) return;
  
  const total = productItems.reduce((sum, item) => sum + item.total, 0);
  totalAmountElement.textContent = formatCurrency(total);
  
  const totalInput = document.getElementById("total");
  if (totalInput) {
    totalInput.value = total;
  }
};

const updateProductItemsList = () => {
  const tableBody = document.getElementById("modal-product-list");
 
  if (!tableBody) return;
 
  tableBody.innerHTML = "";
 
  if (!productItems || productItems.length === 0) {
    const totalAmountElement = document.getElementById("totalAmount");
    if (totalAmountElement) {
      totalAmountElement.textContent = formatCurrency(0);
    }
    return;
  }
 
  productItems.forEach((item, index) => {
    const row = document.createElement("tr");
   
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.sale_price)}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>
        <button type="button" class="icon-button delete-button" onclick="removeProductItem(${index})">
          <i class="material-icons">delete</i>
        </button>
      </td>
    `;
   
    tableBody.appendChild(row);
  });

  updateTotalAmount();
};

function updateProductTotal() {
  const quantity = parseInt(document.getElementById("quantity").value) || 0;
  const price = parseColombianPrice(document.getElementById("salePrice").value) || 0;
  const totalElement = document.getElementById("product-total");
  
  if (totalElement) {
    const total = quantity * price;
    totalElement.textContent = formatCurrency(total);
  }
}

function showProductStock() {
  const stockInfo = document.getElementById("stockInfo");
  const currentStockElement = document.getElementById("currentStock");
  
  if (!stockInfo || !currentStockElement) return;
  
  let selectedProductId = '';
  
  // Obtener ID del producto según el tipo de selector
  if (customProductSelector && isRegisterPage) {
    selectedProductId = customProductSelector.getValue();
  } else {
    const productSelect = document.getElementById("product");
    if (productSelect) {
      selectedProductId = productSelect.value;
    }
  }
  
  if (selectedProductId && productIdToStockMap[selectedProductId] !== undefined) {
    const stock = productIdToStockMap[selectedProductId];
    currentStockElement.textContent = stock;
    stockInfo.style.display = "block";
  } else {
    stockInfo.style.display = "none";
  }
}

function onProductChange() {
  const productSelect = document.getElementById('product');
  if (!productSelect) return;
  
  const selectedOption = productSelect.options[productSelect.selectedIndex];
  const price = selectedOption.getAttribute('data-price');
  const salePriceInput = document.getElementById('salePrice');
  
  if (salePriceInput && price && price !== "0") {
    salePriceInput.value = parseFloat(price);
    updateProductTotal();
    validatePrice('salePrice');
  }
}

// ===== FUNCIONES DE OPERACIONES CRUD =====

const viewSaleDetails = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  try {
    const res = await fetch(`${API_SALES}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los detalles de la venta.");
      return;
    }

    const sale = await res.json();
    
    let customerName = "Sin Cliente";
    if (sale.customer) {
      if (typeof sale.customer === 'object' && sale.customer.name) {
        customerName = `${sale.customer.name} ${sale.customer.lastname || ''}`.trim();
      } else {
        customerName = getCustomerNameById(sale.customer);
      }
    } else if (sale.cliente) {
      if (typeof sale.cliente === 'object' && sale.cliente.name) {
        customerName = `${sale.cliente.name} ${sale.cliente.lastname || ''}`.trim();
      } else {
        customerName = getCustomerNameById(sale.cliente);
      }
    }
    
    let branchName = "Sin Sucursal";
    if (sale.branch) {
      if (typeof sale.branch === 'object' && sale.branch.name) {
        branchName = sale.branch.address ? `${sale.branch.name} - ${sale.branch.address}` : sale.branch.name;
      } else {
        branchName = getBranchNameById(sale.branch);
      }
    }
    
    const salesDate = formatDate(sale.sales_date || sale.fecha_venta || sale.salesDate);
    const totalFormatted = formatCurrency(sale.total);
    const status = sale.status || sale.estado || "processing";
    
    let products = [];
    if (sale.products && Array.isArray(sale.products) && sale.products.length > 0) {
      products = sale.products.map(item => ({
        name: item.product?.name || getProductNameById(item.product?._id || item.product),
        quantity: item.quantity || 0,
        price: item.sale_price || 0,
        total: item.total || (item.quantity * item.sale_price) || 0
      }));
    } else if (sale.productos && Array.isArray(sale.productos) && sale.productos.length > 0) {
      products = sale.productos.map(item => ({
        name: item.producto?.name || getProductNameById(item.producto?._id || item.producto),
        quantity: item.cantidad || 0,
        price: item.precio_venta || 0,
        total: item.total || (item.cantidad * item.precio_venta) || 0
      }));
    }
    
    let productsTableHtml = '<p class="no-data">No hay productos en esta venta</p>';
    
    if (products.length > 0) {
      productsTableHtml = `
        <div class="details-table-wrapper">
          <table class="details-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Venta</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      products.forEach(item => {
        productsTableHtml += `
          <tr>
            <td>${item.name}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.price)}</td>
            <td class="text-right">${formatCurrency(item.total)}</td>
          </tr>
        `;
      });
      
      productsTableHtml += `
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right"><strong>TOTAL:</strong></td>
                <td class="text-right"><strong>${totalFormatted}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }
    
    let additionalInfo = '';
    if (sale.status === 'cancelled') {
      if (sale.cancellation_reason) {
        additionalInfo += `
          <div class="info-row">
            <span class="info-label">Motivo de cancelación</span>
            <span class="info-value">${sale.cancellation_reason}</span>
          </div>
        `;
      }
      if (sale.cancelledAt) {
        additionalInfo += `
          <div class="info-row">
            <span class="info-label">Cancelada el</span>
            <span class="info-value">${formatDate(sale.cancelledAt)}</span>
          </div>
        `;
      }
    }
    
    if (sale.completedAt && sale.status === 'completed') {
      additionalInfo += `
        <div class="info-row">
          <span class="info-label">Completada el</span>
          <span class="info-value">${formatDate(sale.completedAt)}</span>
        </div>
      `;
    }
    
    const statusLabels = {
      'processing': 'Procesando',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    
    const detailsModalHtml = `
      <div id="detailsModal" class="custom-modal">
        <div class="custom-modal-wrapper">
          <div class="custom-modal-header">
            <h3>Detalles de Venta: ${sale.id || sale._id || ""}</h3>
            <button class="modal-close" onclick="closeDetailsModal()">&times;</button>
          </div>
          
          <div class="custom-modal-body">
            <div class="purchase-detail-wrapper">
              <div class="purchase-info-column">
                <div class="info-group">
                  <h4>Información General</h4>
                  <div class="info-row">
                    <span class="info-label">Cliente</span>
                    <span class="info-value">${customerName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Sucursal</span>
                    <span class="info-value">${branchName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Fecha</span>
                    <span class="info-value">${salesDate}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Estado</span>
                    <span class="info-value">${getStatusBadge(status)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Total</span>
                    <span class="info-value total-value">${totalFormatted}</span>
                  </div>
                  ${additionalInfo}
                </div>
              </div>
              
              <div class="purchase-products-column">
                <h4>Productos</h4>
                ${productsTableHtml}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const existingModal = document.getElementById('detailsModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', detailsModalHtml);
    
    document.getElementById('detailsModal').style.display = 'flex';
    
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

const registerSale = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const customerValid = validateCustomer("customer");
  const branchValid = validateBranch("branch");
  const dateValid = validateDate("salesDate");
  
  if (!customerValid || !branchValid || !dateValid) {
    return;
  }
  
  if (productItems.length === 0) {
    const productListError = document.getElementById("productItemsList-error");
    if (productListError) {
      productListError.textContent = "Debe agregar al menos un producto a la venta.";
      productListError.style.display = "block";
    } else {
      showValidation("Debe agregar al menos un producto a la venta.");
    }
    return;
  }
  
  // Obtener valores (selectores personalizados o nativos)
  let customerId = '';
  let branchId = '';
  
  if (customCustomerSelector && isRegisterPage) {
    customerId = customCustomerSelector.getValue();
  } else {
    const customerSelect = document.getElementById("customer");
    customerId = customerSelect ? customerSelect.value : '';
  }
  
  if (customBranchSelector && isRegisterPage) {
    branchId = customBranchSelector.getValue();
  } else {
    const branchSelect = document.getElementById("branch");
    branchId = branchSelect ? branchSelect.value : '';
  }

  // Validar que los IDs no estén vacíos
  if (!customerId || customerId.trim() === '') {
    showError("Error: Debe seleccionar un cliente válido");
    return;
  }
  
  if (!branchId || branchId.trim() === '') {
    showError("Error: Debe seleccionar una sucursal válida");
    return;
  }
  
  const salesDateInput = document.getElementById("salesDate");
  const salesDate = salesDateInput.value;

  // Preparar los productos en el formato correcto
  const formattedProducts = productItems.map(item => ({
    product: item.product,
    quantity: parseInt(item.quantity),
    sale_price: parseFloat(item.sale_price)
  }));

  try {
    const payload = {
      customer: customerId,
      branch: branchId,
      products: formattedProducts,
      salesDate: salesDate
    };
    
    const res = await fetch(API_SALES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    hideLoadingIndicator();
    
    if (!res.ok) {
      let errorMessage = "No se pudo registrar la venta.";
      
      try {
        const data = await res.json();
        errorMessage = data.message || data.error || errorMessage;
        
        // Si hay errores específicos de validación, mostrarlos
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += "\n• " + data.errors.join("\n• ");
        }
      } catch (parseError) {
        errorMessage = `Error del servidor (${res.status}): ${res.statusText}`;
      }
      
      showError(errorMessage);
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      data = { message: "Venta registrada correctamente" };
    }
    
    if (isRegisterPage) {
      // Guardar mensaje de éxito para mostrarlo en la siguiente página
      localStorage.setItem('saleSuccessMessage', 'Venta registrada correctamente');
      
      // Redirigir inmediatamente a la lista de ventas
      window.location.href = "sale.html";
    } else {
      showSuccess("Venta registrada correctamente.");
      closeModal('registerModal');
      
      const saleForm = document.getElementById("saleForm");
      if (saleForm) {
        saleForm.reset();
      }
      
      productItems = [];
      updateProductItemsList();
      
      // Ocultar la información de stock
      const stockInfo = document.getElementById("stockInfo");
      if (stockInfo) {
        stockInfo.style.display = "none";
      }
      
      loadSalesInternal();
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error de conexión al registrar venta: " + (err.message || err));
  }
};

const updateSaleStatus = async (id, newStatus) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const currentSale = allSales.find(sale => sale._id === id);
  if (!currentSale) {
    showError("Venta no encontrada.");
    return;
  }
  
  const currentStatus = currentSale.status || "processing";
  
  if (currentStatus === newStatus) {
    return;
  }
  
  const allowedTransitions = {
    "processing": ["completed", "cancelled"],
    "completed": [],
    "cancelled": []
  };
  
  if (!allowedTransitions[currentStatus].includes(newStatus)) {
    showError(`No se puede cambiar el estado de ${currentStatus} a ${newStatus}.`);
    loadSalesInternal();
    return;
  }
  
  try {
    showLoadingIndicator();
    
    const res = await fetch(`${API_SALES}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    hideLoadingIndicator();
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      const statusMessages = {
        "processing": "Venta está siendo procesada con stock reservado",
        "completed": "Venta completada exitosamente - stock consumido permanentemente",
        "cancelled": "Venta cancelada - el stock reservado ha sido restaurado"
      };
      
      showSuccess(statusMessages[newStatus] || 'Estado de venta actualizado correctamente.');
      loadSalesInternal();
    } else {
      let errorMsg = data.message || `Error al actualizar el estado de la venta (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
      loadSalesInternal();
    }
  } catch (err) {
    hideLoadingIndicator();
    showError(`Ocurrió un error de red: ${err.message || err}`);
    loadSalesInternal();
  }
};

const deleteSale = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const saleToDelete = allSales.find(sale => sale._id === id);
  if (!saleToDelete) {
    showError("Venta no encontrada.");
    return;
  }
  
  const saleStatus = saleToDelete.status || "processing";
  
  if (!["processing", "cancelled"].includes(saleStatus)) {
    showError("Solo se pueden eliminar ventas en estado 'Procesando' o 'Cancelada'.");
    return;
  }
  
  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar esta venta?",
    text: `Esta acción no se puede deshacer. ${saleStatus === "processing" ? "El stock reservado será restaurado." : ""}`,
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });
  
  if (!confirmed) return;

  try {
    showLoadingIndicator();
    
    const res = await fetch(`${API_SALES}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    hideLoadingIndicator();
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo eliminar la venta");
      return;
    }
    
    const data = await res.json();
    showSuccess(data.message || "Venta eliminada correctamente.");
    loadSalesInternal();
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al eliminar venta: " + (err.message || err));
  }
};

const searchSale = () => {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalSales) return;
  
  if (!term) {
    allSales = [...originalSales];
  } else {
    allSales = originalSales.filter(s => {
      const customerMatch = 
        (s.customer?.name && s.customer.name.toLowerCase().includes(term)) ||
        (s.customer?.lastname && s.customer.lastname.toLowerCase().includes(term)) ||
        (s.cliente?.name && s.cliente.name.toLowerCase().includes(term)) ||
        (s.cliente?.lastname && s.cliente.lastname.toLowerCase().includes(term)) ||
        (typeof s.customer === 'string' && customerIdToNameMap[s.customer] && customerIdToNameMap[s.customer].toLowerCase().includes(term)) ||
        (typeof s.cliente === 'string' && customerIdToNameMap[s.cliente] && customerIdToNameMap[s.cliente].toLowerCase().includes(term));
      
      const branchMatch = 
        (s.branch?.name && s.branch.name.toLowerCase().includes(term)) ||
        (s.branch?.address && s.branch.address.toLowerCase().includes(term)) ||
        (typeof s.branch === 'string' && branchIdToNameMap[s.branch] && branchIdToNameMap[s.branch].toLowerCase().includes(term));
      
      const productsMatch = 
        (s.products && Array.isArray(s.products) && s.products.some(item => {
          if (item.product?.name) {
            return item.product.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.product]) {
            return productIdToNameMap[item.product].toLowerCase().includes(term);
          }
          return false;
        })) ||
        (s.productos && Array.isArray(s.productos) && s.productos.some(item => {
          if (item.producto?.name) {
            return item.producto.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.producto]) {
            return productIdToNameMap[item.producto].toLowerCase().includes(term);
          }
          return false;
        }));
      
      const statusMatch = 
        (s.status && s.status.toLowerCase().includes(term)) ||
        (s.estado && s.estado.toLowerCase().includes(term));
      
      return (
        customerMatch || 
        branchMatch ||
        productsMatch ||
        statusMatch ||
        (s.id && s.id.toLowerCase().includes(term))
      );
    });
  }
  
  currentPage = 1;
  renderSalesTable(currentPage);
};

// ===== FUNCIONES DE UTILIDAD ADICIONALES =====

const closeDetailsModal = () => {
  const modal = document.getElementById('detailsModal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
};

// ===== FUNCIONES DE INICIALIZACIÓN =====

function initializeValidationEvents() {
  disableNativeBrowserValidation();
  
  const customerSelect = document.getElementById("customer");
  if (customerSelect) {
    customerSelect.addEventListener("change", () => validateCustomer("customer"));
  }
  
  const branchSelect = document.getElementById("branch");
  if (branchSelect) {
    branchSelect.addEventListener("change", () => validateBranch("branch"));
  }
  
  const salesDateInput = document.getElementById("salesDate");
  if (salesDateInput) {
    salesDateInput.addEventListener("blur", () => validateDate("salesDate"));
  }
  
  const productSelect = document.getElementById("product");
  if (productSelect) {
    productSelect.addEventListener("change", () => validateProduct("product"));
  }
  
  const quantityInput = document.getElementById("quantity");
  if (quantityInput) {
    quantityInput.addEventListener("blur", () => validateQuantity("quantity"));
    quantityInput.addEventListener("keypress", (evt) => isNumber(evt));
    quantityInput.addEventListener("input", updateProductTotal);
  }
  
  const salePriceInput = document.getElementById("salePrice");
  if (salePriceInput) {
    salePriceInput.addEventListener("input", () => {
      formatPriceOnInput(salePriceInput);
      updateProductTotal();
    });
    salePriceInput.addEventListener("blur", () => validatePrice("salePrice"));
    salePriceInput.addEventListener("keypress", (evt) => isNumber(evt));
  }
  
  const saleForm = document.getElementById("saleForm");
  if (saleForm) {
    saleForm.onsubmit = (event) => {
      event.preventDefault();
      registerSale();
    };
  }
  
  const addToListBtn = document.getElementById("addToListBtn");
  if (addToListBtn) {
    addToListBtn.addEventListener("click", function(event) {
      event.preventDefault();
      addProductItem();
    });
  }
  
  const addProductButton = document.getElementById("addProductButton");
  if (addProductButton) {
    addProductButton.addEventListener("click", function(event) {
      event.preventDefault();
      addProductItem();
    });
  }
  
  if (isRegisterPage) {
    const cancelButton = document.getElementById("cancelButton");
    if (cancelButton) {
      cancelButton.addEventListener("click", function(event) {
        event.preventDefault();
      });
    }
    
    const backButton = document.getElementById("backButton");
    if (backButton) {
      backButton.addEventListener("click", function(event) {
        event.preventDefault();
      });
    }
    
    const registerButton = document.getElementById("registerButton");
    if (registerButton) {
      registerButton.addEventListener("click", function(event) {
        event.preventDefault();
        registerSale();
      });
    }
  }
}

function initializeListPage() {
  const saleTableBody = document.getElementById("salesTableBody");
  if (!saleTableBody) {
    return;
  }
  
  // Verificar si hay un mensaje de éxito guardado desde el registro
  const successMessage = localStorage.getItem('saleSuccessMessage');
  if (successMessage) {
    // Mostrar la alerta de éxito después de que la página termine de cargar
    setTimeout(() => {
      showSuccess(successMessage);
      // Eliminar el mensaje del localStorage para que no se muestre de nuevo
      localStorage.removeItem('saleSuccessMessage');
    }, 500);
  }
  
  try {
    listSales();
  } catch (err) {
    showError("Error al inicializar la página");
  }
  
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => window.location.href = "sale-register.html";
  }
  
  const addUserButton = document.getElementById("addUserButton");
  if (addUserButton) {
    addUserButton.onclick = () => window.location.href = "sale-register.html";
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchSale);
  }
}

function initializeRegisterPage() {
  productItems = [];
  
  try {
    loadProducts();
    loadCustomers();
    loadBranches();
  } catch (err) {
    showError("Error al cargar datos iniciales. Por favor, recargue la página.");
  }
  
  // ✅ NUEVA IMPLEMENTACIÓN - fecha local sin conversión UTC
  const salesDateElement = document.getElementById("salesDate");
  if (salesDateElement) {
    const todayLocal = getTodayLocal();
    salesDateElement.value = todayLocal;
    salesDateElement.max = todayLocal;
  }
  
  // Inicializar total en 0
  const totalAmountElement = document.getElementById("totalAmount");
  if (totalAmountElement) {
    totalAmountElement.textContent = formatCurrency(0);
  }
  
  const productTotalElement = document.getElementById("product-total");
  if (productTotalElement) {
    productTotalElement.textContent = formatCurrency(0);
  }
  
  // Ocultar información de stock inicialmente
  const stockInfo = document.getElementById("stockInfo");
  if (stockInfo) {
    stockInfo.style.display = "none";
  }
}

// ===== EVENTOS AL CARGAR EL DOM =====

document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;
  
  initializeValidationEvents();
  
  if (isListPage) {
    initializeListPage();
  } else if (isRegisterPage) {
    initializeRegisterPage();
  }
});

// ===== FUNCIONES GLOBALES =====

window.validateField = validateField;
window.validateQuantity = validateQuantity;
window.validatePrice = validatePrice;
window.validateCustomer = validateCustomer;
window.validateBranch = validateBranch;
window.validateProduct = validateProduct;
window.validateDate = validateDate;
window.clearValidationErrors = clearValidationErrors;
window.disableNativeBrowserValidation = disableNativeBrowserValidation;
window.deleteSale = deleteSale;
window.updateSaleStatus = updateSaleStatus;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeDetailsModal = closeDetailsModal;
window.searchSale = searchSale;
window.addProductItem = addProductItem;
window.removeProductItem = removeProductItem;
window.viewSaleDetails = viewSaleDetails;
window.isNumber = isNumber;
window.updateProductTotal = updateProductTotal;
window.showProductStock = showProductStock;
window.hideLoadingIndicator = hideLoadingIndicator;
window.onProductChange = onProductChange;
window.formatPriceInput = formatPriceInput;
window.formatPriceOnInput = formatPriceOnInput;
window.parseColombianPrice = parseColombianPrice;
window.addThousandsSeparators = addThousandsSeparators;