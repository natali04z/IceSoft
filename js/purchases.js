const API_PURCHASES = "https://backend-alpha-orpin-58.vercel.app/api/purchases";
const API_PRODUCTS = "https://backend-alpha-orpin-58.vercel.app/api/products";
const API_PROVIDERS = "https://backend-alpha-orpin-58.vercel.app/api/providers";

let allPurchases = [];
let originalPurchases = [];
let currentPage = 1;
const rowsPerPage = 10;
let productItems = [];
let productIdToNameMap = {};
let providerIdToNameMap = {};

const isRegisterPage = window.location.pathname.includes('purchase-register.html');
const isListPage = !isRegisterPage;

function formatLocalDate(date = new Date()) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function getTodayLocal() {
  return formatLocalDate(new Date());
}

function formatDateForDisplay(date) {
  if (!date) return "Fecha no disponible";
  
  try {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('es-CO');
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-CO');
  } catch (e) {
    return date.toString();
  }
}

function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

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

function validateProvider(fieldId) {
  // Para el selector personalizado de proveedores
  if (isRegisterPage && customProviderSelector) {
    const value = customProviderSelector.getValue();
  const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById('providerSearch');
  
    if (!value) {
    errorElement.textContent = "Debe seleccionar un proveedor.";
    errorElement.style.display = "block";
      inputElement.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
      inputElement.classList.remove("input-error");
      return true;
    }
  }
  
  // Para selectores nativos (compatibilidad)
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field || !field.value) {
    if (errorElement) {
      errorElement.textContent = "Debe seleccionar un proveedor.";
      errorElement.style.display = "block";
    }
    if (field) field.classList.add("input-error");
    return false;
  } else {
    if (errorElement) errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

function validateProduct(fieldId) {
  // Para el selector personalizado de productos
  if (isRegisterPage && customProductSelector) {
    const value = customProductSelector.getValue();
  const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById('productSearch');
  
    if (!value) {
    errorElement.textContent = "Debe seleccionar un producto.";
    errorElement.style.display = "block";
      inputElement.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
      inputElement.classList.remove("input-error");
      return true;
    }
  }
  
  // Para selectores nativos (compatibilidad)
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field || !field.value) {
    if (errorElement) {
      errorElement.textContent = "Debe seleccionar un producto.";
      errorElement.style.display = "block";
    }
    if (field) field.classList.add("input-error");
    return false;
  } else {
    if (errorElement) errorElement.style.display = "none";
    field.classList.remove("input-error");
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
  const purchaseForm = document.getElementById("purchaseForm");
  if (purchaseForm) {
    purchaseForm.setAttribute("novalidate", "");
    const inputs = purchaseForm.querySelectorAll("input, select");
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

function getUserPermissions() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return ['edit_purchases', 'delete_purchases'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['edit_purchases', 'delete_purchases'];
  } catch (error) {
    return ['edit_purchases', 'delete_purchases'];
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
    clearValidationErrors('purchaseForm');
    
    const purchaseForm = document.getElementById("purchaseForm");
    if (purchaseForm) {
      purchaseForm.reset();
    }
    
    productItems = [];
    updateProductItemsList();
    
    const purchaseDateElement = document.getElementById("purchaseDate");
    if (purchaseDateElement) {
      const todayLocal = getTodayLocal();
      purchaseDateElement.value = todayLocal;
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

function hideLoadingIndicator() {
  Swal.close();
}

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

const getProviderNameById = (providerId) => {
  if (!providerId) return "Proveedor desconocido";
  return providerIdToNameMap[providerId] || "Proveedor no encontrado";
};

const loadPurchasesInternal = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_PURCHASES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError( "No se pudo listar las compras.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      showError("Error al listar las compras.");
      return;
    }
    
    if (data && typeof data === 'object' && data.purchases) {
      originalPurchases = data.purchases;
    } 
    else if (Array.isArray(data)) {
      originalPurchases = data;
    }
    else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        originalPurchases = data[arrayProps[0]];
      } else {
        originalPurchases = [];
      }
    } else {
      originalPurchases = [];
    }
    
    if (!Array.isArray(originalPurchases)) {
      originalPurchases = [];
    }
    
    originalPurchases = originalPurchases.map(purchase => {
      let adaptedPurchase = {...purchase};
   
      if (!adaptedPurchase || typeof adaptedPurchase !== 'object') {
        return {};
      }
      
      if (adaptedPurchase.status === undefined && adaptedPurchase.estado !== undefined) {
        adaptedPurchase.status = adaptedPurchase.estado;
      } else if (adaptedPurchase.estado === undefined && adaptedPurchase.status !== undefined) {
        adaptedPurchase.estado = adaptedPurchase.status;
      }
      
      if (adaptedPurchase.purchase_date === undefined && adaptedPurchase.fecha_compra !== undefined) {
        adaptedPurchase.purchase_date = adaptedPurchase.fecha_compra;
      } else if (adaptedPurchase.fecha_compra === undefined && adaptedPurchase.purchase_date !== undefined) {
        adaptedPurchase.fecha_compra = adaptedPurchase.purchase_date;
      } else if (adaptedPurchase.purchase_date === undefined && adaptedPurchase.fecha_compra === undefined && adaptedPurchase.purchaseDate !== undefined) {
        adaptedPurchase.purchase_date = adaptedPurchase.purchaseDate;
        adaptedPurchase.fecha_compra = adaptedPurchase.purchaseDate;
      }
      
      if (adaptedPurchase.products === undefined && adaptedPurchase.productos !== undefined) {
        adaptedPurchase.products = adaptedPurchase.productos.map(item => ({
          product: item.producto,
          quantity: item.cantidad,
          purchase_price: item.precio_compra,
          total: item.total
        }));
      } else if (adaptedPurchase.productos === undefined && adaptedPurchase.products !== undefined) {
        adaptedPurchase.productos = adaptedPurchase.products.map(item => ({
          producto: item.product,
          cantidad: item.quantity,
          precio_compra: item.purchase_price,
          total: item.total
        }));
      }
      
      if (adaptedPurchase.provider === undefined && adaptedPurchase.proveedor !== undefined) {
        adaptedPurchase.provider = adaptedPurchase.proveedor;
      } else if (adaptedPurchase.proveedor === undefined && adaptedPurchase.provider !== undefined) {
        adaptedPurchase.proveedor = adaptedPurchase.provider;
      }
      
      if (adaptedPurchase.status === undefined && adaptedPurchase.estado === undefined) {
        adaptedPurchase.status = "active";
        adaptedPurchase.estado = "active";
      }
      
      adaptedPurchase.formattedTotal = formatCurrency(adaptedPurchase.total);
      
      return adaptedPurchase;
    }).filter(purchase => purchase && typeof purchase === 'object' && Object.keys(purchase).length > 0);
    
    allPurchases = [...originalPurchases];
    currentPage = 1;
    
    await loadProducts();
    await loadProviders();
    
    renderPurchasesTable(currentPage);
    
    const tbody = document.getElementById("purchaseTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            No se encontraron compras. Puede que necesite agregar una nueva compra o revisar su conexión.
          </td>
        </tr>
      `;
    }
  } catch (err) {
    showError("Error al listar las compras");
  }
};

const listPurchases = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    showLoadingIndicator();
    
    const res = await fetch(API_PURCHASES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    hideLoadingIndicator();

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo listar las compras.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      hideLoadingIndicator();
      showError("Error al listar las compras.");
      return;
    }
    
    if (data && typeof data === 'object' && data.purchases) {
      originalPurchases = data.purchases;
    } 
    else if (Array.isArray(data)) {
      originalPurchases = data;
    }
    else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        originalPurchases = data[arrayProps[0]];
      } else {
        originalPurchases = [];
      }
    } else {
      originalPurchases = [];
    }
    
    if (!Array.isArray(originalPurchases)) {
      originalPurchases = [];
    }
    
    originalPurchases = originalPurchases.map(purchase => {
      let adaptedPurchase = {...purchase};
   
      if (!adaptedPurchase || typeof adaptedPurchase !== 'object') {
        return {};
      }
      
      if (adaptedPurchase.status === undefined && adaptedPurchase.estado !== undefined) {
        adaptedPurchase.status = adaptedPurchase.estado;
      } else if (adaptedPurchase.estado === undefined && adaptedPurchase.status !== undefined) {
        adaptedPurchase.estado = adaptedPurchase.status;
      }
      
      if (adaptedPurchase.purchase_date === undefined && adaptedPurchase.fecha_compra !== undefined) {
        adaptedPurchase.purchase_date = adaptedPurchase.fecha_compra;
      } else if (adaptedPurchase.fecha_compra === undefined && adaptedPurchase.purchase_date !== undefined) {
        adaptedPurchase.fecha_compra = adaptedPurchase.purchase_date;
      } else if (adaptedPurchase.purchase_date === undefined && adaptedPurchase.fecha_compra === undefined && adaptedPurchase.purchaseDate !== undefined) {
        adaptedPurchase.purchase_date = adaptedPurchase.purchaseDate;
        adaptedPurchase.fecha_compra = adaptedPurchase.purchaseDate;
      }
      
      if (adaptedPurchase.products === undefined && adaptedPurchase.productos !== undefined) {
        adaptedPurchase.products = adaptedPurchase.productos.map(item => ({
          product: item.producto,
          quantity: item.cantidad,
          purchase_price: item.precio_compra,
          total: item.total
        }));
      } else if (adaptedPurchase.productos === undefined && adaptedPurchase.products !== undefined) {
        adaptedPurchase.productos = adaptedPurchase.products.map(item => ({
          producto: item.product,
          cantidad: item.quantity,
          precio_compra: item.purchase_price,
          total: item.total
        }));
      }
      
      if (adaptedPurchase.provider === undefined && adaptedPurchase.proveedor !== undefined) {
        adaptedPurchase.provider = adaptedPurchase.proveedor;
      } else if (adaptedPurchase.proveedor === undefined && adaptedPurchase.provider !== undefined) {
        adaptedPurchase.proveedor = adaptedPurchase.provider;
      }
      
      if (adaptedPurchase.status === undefined && adaptedPurchase.estado === undefined) {
        adaptedPurchase.status = "active";
        adaptedPurchase.estado = "active";
      }
      
      adaptedPurchase.formattedTotal = formatCurrency(adaptedPurchase.total);
      
      return adaptedPurchase;
    }).filter(purchase => purchase && typeof purchase === 'object' && Object.keys(purchase).length > 0);
    
    allPurchases = [...originalPurchases];
    currentPage = 1;
    
    await loadProducts();
    await loadProviders();
    
    renderPurchasesTable(currentPage);
    
    const tbody = document.getElementById("purchaseTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            No se encontraron compras. Puede que necesite agregar una nueva compra o revisar su conexión.
          </td>
        </tr>
      `;
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar las compras");
  }
};

// Clase para manejar el selector personalizado de productos
class CustomProductSelector {
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
      id: product._id,
      name: product.name || 'Sin nombre',
      price: product.price || 0
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
      `<div class="custom-select-option" data-id="${product.id}" data-price="${product.price}">
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

    // Actualizar valores
    this.selectedProduct = { id: productId, name: productName, price: productPrice };
    this.input.value = productName;
    this.hiddenInput.value = productId;

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
    this.filteredProducts = [...this.products];
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

// Instancias globales de los selectores personalizados
let customProductSelector = null;
let customProviderSelector = null;

// Clase para manejar el selector personalizado de proveedores
class CustomProviderSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById('providerSearch');
    this.hiddenInput = document.getElementById('provider');
    this.dropdown = document.getElementById('providerDropdown');
    this.searchInput = document.getElementById('providerSearchInput');
    this.optionsContainer = document.getElementById('providerOptions');
    this.providers = [];
    this.filteredProviders = [];
    this.selectedProvider = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Event listeners
    this.input.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.filterProviders(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setProviders(providers) {
    this.providers = providers.map(provider => ({
      id: provider._id,
      name: provider.company || provider.name || 'Sin nombre',
      company: provider.company || 'Sin empresa'
    }));
    this.filteredProviders = [...this.providers];
    this.renderOptions();
  }

  filterProviders(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredProviders = [...this.providers];
    } else {
      this.filteredProviders = this.providers.filter(provider => 
        provider.name.toLowerCase().includes(term) ||
        provider.company.toLowerCase().includes(term)
      );
    }
    
    this.renderOptions();
  }

  renderOptions() {
    if (this.filteredProviders.length === 0) {
      this.optionsContainer.innerHTML = '<div class="custom-select-no-results">No se encontraron proveedores</div>';
      return;
    }

    const optionsHTML = this.filteredProviders.map(provider => 
      `<div class="custom-select-option" data-id="${provider.id}">
        ${provider.name}
      </div>`
    ).join('');

    this.optionsContainer.innerHTML = optionsHTML;

    // Agregar event listeners a las opciones
    this.optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => this.selectOption(option));
    });
  }

  selectOption(optionElement) {
    const providerId = optionElement.dataset.id;
    const providerName = optionElement.textContent.trim();

    // Actualizar valores
    this.selectedProvider = { id: providerId, name: providerName };
    this.input.value = providerName;
    this.hiddenInput.value = providerId;

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
    this.filteredProviders = [...this.providers];
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
    const errorElement = document.getElementById('provider-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.input.classList.remove('input-error');
  }

  reset() {
    this.selectedProvider = null;
    this.input.value = '';
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    this.filteredProviders = [...this.providers];
    this.renderOptions();
    this.close();
  }

  getValue() {
    return this.hiddenInput.value;
  }

  getSelectedProvider() {
    return this.selectedProvider;
  }
}

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
    
    // Inicializar selector personalizado en páginas de registro
    if (isRegisterPage) {
      if (!customProductSelector) {
        customProductSelector = new CustomProductSelector('productSelectContainer');
      }
      customProductSelector.setProducts(products);
    }

    // Mantener compatibilidad con selector nativo para otras páginas
    const editProductSelect = document.getElementById("editProduct");
    
    if (editProductSelect) {
      editProductSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar producto</option>`;
    }
    
    productIdToNameMap = {};
    products.forEach(prod => {
      if (!prod || typeof prod !== 'object') return;
      
      const productId = prod._id;
      const productName = prod.name || 'Sin nombre';
      
      if (productId) {
        productIdToNameMap[productId] = productName;
        
        const option = `<option value="${productId}" data-price="${prod.price || 0}">${productName}</option>`;
        if (editProductSelect) editProductSelect.innerHTML += option;
      }
    });
  } catch (err) {
    showError("Error al listar los productos");
  }
};

const loadProviders = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    const res = await fetch(API_PROVIDERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError("No se pudo listar los proveedores.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      return;
    }
    
    let providers = [];
    
    if (data && typeof data === 'object' && data.providers) {
      providers = data.providers;
    } else if (Array.isArray(data)) {
      providers = data;
    } else if (data && typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        providers = data[arrayProps[0]];
      }
    }
    
    if (!Array.isArray(providers)) {
      providers = [];
    }
    
    // Inicializar selector personalizado en páginas de registro
    if (isRegisterPage) {
      if (!customProviderSelector) {
        customProviderSelector = new CustomProviderSelector('providerSelectContainer');
      }
      customProviderSelector.setProviders(providers);
    }

    // Mantener compatibilidad con selector nativo para otras páginas
    const editProviderSelect = document.getElementById("editProvider");
    
    if (editProviderSelect) {
      editProviderSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar proveedor</option>`;
    }
    
    providerIdToNameMap = {};
    providers.forEach(prov => {
      if (!prov || typeof prov !== 'object') return;
      
      const providerId = prov._id;
      const providerName = prov.company || prov.name || 'Sin nombre';
      
      if (providerId) {
        providerIdToNameMap[providerId] = providerName;
        
        const option = `<option value="${providerId}">${providerName}</option>`;
        if (editProviderSelect) editProviderSelect.innerHTML += option;
      }
    });
 } catch (err) {
    showError("Error al listar los proveedores");
  }
};

const renderPurchasesTable = (page = 1) => {
  const tbody = document.getElementById("purchaseTableBody");
  
  if (!tbody) {
    return;
  }
  
  tbody.innerHTML = "";

  if (!allPurchases || allPurchases.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          No hay compras disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const purchasesToShow = allPurchases.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditPurchases = userPermissions.includes("edit_purchases");
  
  let tableContent = '';

  purchasesToShow.forEach((purchase, index) => {
    try {
      const purchaseId = purchase._id || "";
      const displayId = purchase.id || purchaseId || `Pu${String(index + 1).padStart(2, '0')}`;
      
      let providerName = "Sin Proveedor";
      if (purchase.provider) {
        if (typeof purchase.provider === 'object' && purchase.provider.company) {
          providerName = purchase.provider.company;
        } else {
          providerName = getProviderNameById(purchase.provider);
        }
      } else if (purchase.proveedor) {
        if (typeof purchase.proveedor === 'object' && purchase.proveedor.company) {
          providerName = purchase.proveedor.company;
        } else {
          providerName = getProviderNameById(purchase.proveedor);
        }
      }
      
      const purchaseDate = purchase.purchase_date || purchase.fecha_compra || purchase.purchaseDate;
      const status = purchase.status || purchase.estado || "active";
      
      const formattedTotal = purchase.formattedTotal || formatCurrency(purchase.total);
      
      tableContent += `
        <tr data-id="${purchaseId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${providerName}</td>
          <td>${formatDate(purchaseDate)}</td>
          <td>${formattedTotal}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                ${canEditPurchases ? `onclick="handleSwitchClick(event, '${purchaseId}', '${status}')"` : 'disabled'}>
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="viewPurchaseDetails('${purchaseId}')" class="icon-button view-button" title="Ver detalles">
                <i class="material-icons">visibility</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="6" class="text-center text-danger">
            Error al renderizar esta compra: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  renderPaginationControls();
};

const renderPaginationControls = () => {
  if (!allPurchases || allPurchases.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allPurchases.length / rowsPerPage);
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
    const startItem = allPurchases.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allPurchases.length);
    info.innerHTML = `${startItem}-${endItem} de ${allPurchases.length}`;
  }
};

const changePage = (page) => {
  currentPage = page;
  renderPurchasesTable(currentPage);
};

const handleSwitchClick = async (event, purchaseId, currentStatus) => {
  event.preventDefault();
  
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  const success = await updatePurchaseStatus(purchaseId, newStatus);
};

const addProductItem = () => {
  const quantityInput = document.getElementById("quantity");
  const purchasePriceInput = document.getElementById("purchasePrice");
  
  if (!quantityInput || !purchasePriceInput) {
    showError("No se pudieron encontrar los campos del formulario");
    return;
  }
  
  const productValid = validateProduct("product");
  const quantityValid = validateQuantity("quantity");
  const priceValid = validatePrice("purchasePrice");
  
  if (!productValid || !quantityValid || !priceValid) {
    return;
  }
  
  // Obtener datos del producto según el tipo de selector
  let productId, productName;
  
  if (isRegisterPage && customProductSelector) {
    // Selector personalizado con búsqueda
    const selectedProduct = customProductSelector.getSelectedProduct();
    if (!selectedProduct) {
      showError("Debe seleccionar un producto.");
      return;
    }
    productId = selectedProduct.id;
    productName = selectedProduct.name;
  } else {
    // Selector nativo (para compatibilidad)
    const productSelect = document.getElementById("product");
    if (!productSelect) {
      showError("Error: No se pudo encontrar el selector de productos");
      return;
    }
    productId = productSelect.value;
    productName = productSelect.options[productSelect.selectedIndex].text;
  }
  
  const quantity = parseInt(quantityInput.value);
  const purchasePrice = parseColombianPrice(purchasePriceInput.value);
  
  if (quantity <= 0) {
    showError("La cantidad debe ser mayor que cero");
    return;
  }
  
  if (purchasePrice <= 0) {
    showError("El precio debe ser mayor que cero");
    return;
  }
  
  const total = quantity * purchasePrice;
  
  const existingProductIndex = productItems.findIndex(item => item.product === productId);
  
  if (existingProductIndex >= 0) {
    productItems[existingProductIndex].quantity += quantity;
    productItems[existingProductIndex].total = productItems[existingProductIndex].quantity * productItems[existingProductIndex].purchase_price;
    
    showSuccess("Producto actualizado en la lista");
  } else {
    productItems.push({
      product: productId,
      quantity: quantity,
      purchase_price: purchasePrice,
      total: total,
      name: productName
    });
    
    showSuccess("Producto agregado a la lista");
  }
  
  updateProductItemsList();
  
  // Limpiar campos según el tipo de selector
  if (isRegisterPage && customProductSelector) {
    customProductSelector.reset();
  } else {
    const productSelect = document.getElementById("product");
    if (productSelect) productSelect.selectedIndex = 0;
  }
  
  quantityInput.value = "1";
  purchasePriceInput.value = "";
  document.getElementById("product-total").textContent = formatCurrency(0);
  
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
      <td>${formatCurrency(item.purchase_price)}</td>
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
  const price = parseColombianPrice(document.getElementById("purchasePrice").value) || 0;
  const totalElement = document.getElementById("product-total");
  
  if (totalElement) {
    const total = quantity * price;
    totalElement.textContent = formatCurrency(total);
  }
}

const viewPurchaseDetails = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  try {
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los detalles de la compra.");
      return;
    }

    const purchase = await res.json();
    
    let providerName = "Sin Proveedor";
    if (purchase.provider) {
      if (typeof purchase.provider === 'object' && purchase.provider.company) {
        providerName = purchase.provider.company;
      } else {
        providerName = getProviderNameById(purchase.provider);
      }
    } else if (purchase.proveedor) {
      if (typeof purchase.proveedor === 'object' && purchase.proveedor.company) {
        providerName = purchase.proveedor.company;
      } else {
        providerName = getProviderNameById(purchase.proveedor);
      }
    }
    
    const purchaseDate = formatDate(purchase.purchase_date || purchase.fecha_compra || purchase.purchaseDate);
    const totalFormatted = formatCurrency(purchase.total);
    const status = purchase.status || purchase.estado || "active";
    
    let products = [];
    if (purchase.products && Array.isArray(purchase.products) && purchase.products.length > 0) {
      products = purchase.products.map(item => ({
        name: item.product?.name || getProductNameById(item.product?._id || item.product),
        quantity: item.quantity || 0,
        price: item.purchase_price || 0,
        total: item.total || (item.quantity * item.purchase_price) || 0
      }));
    } else if (purchase.productos && Array.isArray(purchase.productos) && purchase.productos.length > 0) {
      products = purchase.productos.map(item => ({
        name: item.producto?.name || getProductNameById(item.producto?._id || item.producto),
        quantity: item.cantidad || 0,
        price: item.precio_compra || 0,
        total: item.total || (item.cantidad * item.precio_compra) || 0
      }));
    }
    
    let productsTableHtml = '<p class="no-data">No hay productos en esta compra</p>';
    
    if (products.length > 0) {
      productsTableHtml = `
        <div class="details-table-wrapper">
          <table class="details-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Compra</th>
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
    
    if (status === 'inactive') {
      const deactivationReason = purchase.deactivation_reason || 'No especificado';
      additionalInfo += `
        <div class="info-row">
          <span class="info-label">Motivo de desactivación</span>
          <span class="info-value">${deactivationReason}</span>
        </div>
      `;
      
      if (purchase.deactivated_at) {
        additionalInfo += `
          <div class="info-row">
            <span class="info-label">Desactivada el</span>
            <span class="info-value">${formatDate(purchase.deactivated_at)}</span>
          </div>
        `;
      }
    }
    
    if (purchase.reactivation_reason) {
      additionalInfo += `
        <div class="info-row">
          <span class="info-label">Motivo de reactivación</span>
          <span class="info-value">${purchase.reactivation_reason}</span>
        </div>
      `;
      
      if (purchase.reactivated_at) {
        additionalInfo += `
          <div class="info-row">
            <span class="info-label">Reactivada el</span>
            <span class="info-value">${formatDate(purchase.reactivated_at)}</span>
          </div>
        `;
      }
    }
    
    const detailsModalHtml = `
      <div id="detailsModal" class="custom-modal">
        <div class="custom-modal-wrapper">
          <div class="custom-modal-header">
            <h3>Detalles de Compra: ${purchase.id || purchase._id || ""}</h3>
            <button class="modal-close" onclick="closeDetailsModal()">&times;</button>
          </div>
          
          <div class="custom-modal-body">
            <div class="purchase-detail-wrapper">
              <div class="purchase-info-column">
                <div class="info-group">
                  <h4>Información General</h4>
                  <div class="info-row">
                    <span class="info-label">Proveedor</span>
                    <span class="info-value">${providerName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Fecha</span>
                    <span class="info-value">${purchaseDate}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Estado</span>
                    <span class="info-value">
                      <label class="switch">
                        <input type="checkbox" ${status === "active" ? "checked" : ""} disabled>
                        <span class="slider round"></span>
                      </label>
                    </span>
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

const registerPurchase = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const providerValid = validateProvider("provider");
  const dateValid = validateDate("purchaseDate");
  
  if (!providerValid || !dateValid) {
    return;
  }
  
  if (productItems.length === 0) {
    const productListError = document.getElementById("productItemsList-error");
    if (productListError) {
      productListError.textContent = "Debe agregar al menos un producto a la compra.";
      productListError.style.display = "block";
    } else {
      showValidation("Debe agregar al menos un producto a la compra.");
    }
    return;
  }
  
  const purchaseDateInput = document.getElementById("purchaseDate");
  
  // Obtener el ID del proveedor según el tipo de selector
  let providerId;
  if (isRegisterPage && customProviderSelector) {
    // Selector personalizado con búsqueda
    providerId = customProviderSelector.getValue();
  } else {
    // Selector nativo (para compatibilidad)
    const providerSelect = document.getElementById("provider");
    providerId = providerSelect ? providerSelect.value : '';
  }
  const purchaseDate = purchaseDateInput.value;
  
  const total = productItems.reduce((sum, item) => sum + item.total, 0);

  const formattedProducts = productItems.map(item => ({
    product: item.product,
    quantity: parseInt(item.quantity),
    purchase_price: parseFloat(item.purchase_price)
  }));

  try {
    const payload = {
      provider: providerId,
      products: formattedProducts,
      purchase_date: purchaseDate
    };
    
    const res = await fetch(API_PURCHASES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    hideLoadingIndicator();
    
    if (!res.ok) {
      let errorMessage = "No se pudo registrar la compra.";
      
      try {
        const data = await res.json();
        errorMessage = data.message || data.error || errorMessage;
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
      data = { message: "Compra registrada correctamente" };
    }
    
    if (isRegisterPage) {
      // Guardar mensaje de éxito para mostrarlo en la siguiente página
      localStorage.setItem('purchaseSuccessMessage', 'Compra registrada correctamente');
      
      // Redirigir inmediatamente a la lista de compras
      window.location.href = "purchases.html";
    } else {
      showSuccess("Compra registrada correctamente.");
      closeModal('registerModal');
      
      const purchaseForm = document.getElementById("purchaseForm");
      if (purchaseForm) {
        purchaseForm.reset();
      }
      
      productItems = [];
      updateProductItemsList();
      loadPurchasesInternal();
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error de conexión al registrar compra: " + (err.message || err));
  }
};

const updatePurchaseStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return false;
  }
  
  if (status === 'active') {
    return await reactivatePurchase(id);
  }
  
  const { value: reason } = await Swal.fire({
    title: 'Desactivar Compra',
    text: 'Por favor ingrese el motivo de desactivación:',
    input: 'textarea',
    inputPlaceholder: 'Escriba el motivo...',
    inputAttributes: {
      'aria-label': 'Motivo de desactivación'
    },
    showCancelButton: true,
    confirmButtonText: 'Desactivar',
    cancelButtonText: 'Cancelar',
    allowOutsideClick: false,
    allowEscapeKey: false,
    inputValidator: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Debe ingresar un motivo para la desactivación';
      }
      if (value.trim().length < 10) {
        return 'El motivo debe tener al menos 10 caracteres';
      }
    }
  });
  
  if (!reason) {
    return false;
  }
  
  try {
    showLoadingIndicator();
    
    const res = await fetch(`${API_PURCHASES}/${id}/deactivate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: reason.trim() })
    });
    
    hideLoadingIndicator();
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      showSuccess('Compra desactivada correctamente y stock revertido.');
      loadPurchasesInternal();
      return true;
    } else {
      let errorMsg = data.message || `Error al desactivar la compra (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
      return false;
    }
  } catch (err) {
    hideLoadingIndicator();
    showError(`Ocurrió un error de red: ${err.message || err}`);
    return false;
  }
};

const reactivatePurchase = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return false;
  }
  
  const { value: reason } = await Swal.fire({
    title: 'Reactivar Compra',
    text: 'Por favor ingrese el motivo de reactivación:',
    input: 'textarea',
    inputPlaceholder: 'Escriba el motivo...',
    inputAttributes: {
      'aria-label': 'Motivo de reactivación'
    },
    showCancelButton: true,
    confirmButtonText: 'Reactivar',
    cancelButtonText: 'Cancelar',
    allowOutsideClick: false,
    allowEscapeKey: false,
    inputValidator: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Debe ingresar un motivo para la reactivación';
      }
      if (value.trim().length < 10) {
        return 'El motivo debe tener al menos 10 caracteres';
      }
    }
  });
  
  if (!reason) {
    return false;
  }
  
  try {
    showLoadingIndicator();
    
    const res = await fetch(`${API_PURCHASES}/${id}/reactivate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: reason.trim() })
    });
    
    hideLoadingIndicator();
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      showSuccess('Compra reactivada correctamente y stock restaurado.');
      loadPurchasesInternal();
      return true;
    } else {
      let errorMsg = data.message || `Error al reactivar la compra (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
      return false;
    }
  } catch (err) {
    hideLoadingIndicator();
    showError(`Ocurrió un error de red: ${err.message || err}`);
    return false;
  }
};

const deletePurchase = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar esta compra?",
    text: "Esta acción no se puede deshacer. Solo se pueden eliminar compras inactivas.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });
  
  if (!confirmed) return;

  try {
    showLoadingIndicator();
    
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    hideLoadingIndicator();
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo eliminar la compra");
      return;
    }
    
    showSuccess("Compra eliminada correctamente.");
    loadPurchasesInternal();
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al eliminar compra: " + (err.message || err));
  }
};

const searchPurchase = () => {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalPurchases) return;
  
  if (!term) {
    allPurchases = [...originalPurchases];
  } else {
    allPurchases = originalPurchases.filter(p => {
      const providerMatch = 
        (p.provider?.company && p.provider.company.toLowerCase().includes(term)) ||
        (p.proveedor?.company && p.proveedor.company.toLowerCase().includes(term)) ||
        (typeof p.provider === 'string' && providerIdToNameMap[p.provider] && providerIdToNameMap[p.provider].toLowerCase().includes(term)) ||
        (typeof p.proveedor === 'string' && providerIdToNameMap[p.proveedor] && providerIdToNameMap[p.proveedor].toLowerCase().includes(term));
      
      const productsMatch = 
        (p.products && Array.isArray(p.products) && p.products.some(item => {
          if (item.product?.name) {
            return item.product.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.product]) {
            return productIdToNameMap[item.product].toLowerCase().includes(term);
          }
          return false;
        })) ||
        (p.productos && Array.isArray(p.productos) && p.productos.some(item => {
          if (item.producto?.name) {
            return item.producto.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.producto]) {
            return productIdToNameMap[item.producto].toLowerCase().includes(term);
          }
          return false;
        }));
      
      return (
        providerMatch || 
        productsMatch ||
        (p.id && p.id.toLowerCase().includes(term))
      );
    });
  }
  
  currentPage = 1;
  renderPurchasesTable(currentPage);
};

const checkAuth = () => {
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
};

const closeDetailsModal = () => {
  const modal = document.getElementById('detailsModal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
};

function initializeValidationEvents() {
  disableNativeBrowserValidation();
  
  // Validación de proveedores - compatible con selector personalizado y nativo
  if (isRegisterPage) {
    // Para el selector personalizado, la validación se maneja en la clase
    // pero agregamos el listener al campo hidden para compatibilidad
    const hiddenProviderInput = document.getElementById("provider");
    if (hiddenProviderInput) {
      hiddenProviderInput.addEventListener("change", () => validateProvider("provider"));
    }
  } else {
    // Para páginas con selector nativo
  const providerSelect = document.getElementById("provider");
  if (providerSelect) {
    providerSelect.addEventListener("change", () => validateProvider("provider"));
    }
  }
  
  const purchaseDateInput = document.getElementById("purchaseDate");
  if (purchaseDateInput) {
    purchaseDateInput.addEventListener("blur", () => validateDate("purchaseDate"));
  }
  
  // Validación de productos - compatible con selector personalizado y nativo
  if (isRegisterPage) {
    // Para el selector personalizado, la validación se maneja en la clase
    // pero agregamos el listener al campo hidden para compatibilidad
    const hiddenProductInput = document.getElementById("product");
    if (hiddenProductInput) {
      hiddenProductInput.addEventListener("change", () => validateProduct("product"));
    }
  } else {
    // Para páginas con selector nativo
  const productSelect = document.getElementById("product");
  if (productSelect) {
    productSelect.addEventListener("change", () => validateProduct("product"));
    }
  }
  
  const quantityInput = document.getElementById("quantity");
  if (quantityInput) {
    quantityInput.addEventListener("blur", () => validateQuantity("quantity"));
    quantityInput.addEventListener("keypress", (evt) => isNumber(evt));
    quantityInput.addEventListener("input", updateProductTotal);
  }
  
  const purchasePriceInput = document.getElementById("purchasePrice");
  if (purchasePriceInput) {
    purchasePriceInput.addEventListener("input", () => {
      formatPriceOnInput(purchasePriceInput);
      updateProductTotal();
    });
    purchasePriceInput.addEventListener("blur", () => validatePrice("purchasePrice"));
    purchasePriceInput.addEventListener("keypress", (evt) => isNumber(evt));
  }
  
  const purchaseForm = document.getElementById("purchaseForm");
  if (purchaseForm) {
    purchaseForm.onsubmit = (event) => {
      event.preventDefault();
      registerPurchase();
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
        registerPurchase();
      });
    }
  }
}

function initializeListPage() {
  const productTableBody = document.getElementById("purchaseTableBody");
  if (!productTableBody) {
    return;
  }
  
  // Verificar si hay un mensaje de éxito guardado desde el registro
  const successMessage = localStorage.getItem('purchaseSuccessMessage');
  if (successMessage) {
    // Función para mostrar la alerta con reintentos
    const showSuccessAlert = () => {
      // Verificar que SweetAlert2 esté disponible antes de mostrar la alerta
      if (typeof Swal !== 'undefined' && typeof showSuccess === 'function') {
        try {
          showSuccess(successMessage);
        } catch (error) {
          alert(successMessage);
        }
      } else {
        // Fallback en caso de que SweetAlert2 no esté disponible
        alert(successMessage);
      }
      // Eliminar el mensaje del localStorage para que no se muestre de nuevo
      localStorage.removeItem('purchaseSuccessMessage');
    };
    
    // Intentar mostrar la alerta con un delay mayor
    setTimeout(showSuccessAlert, 1000);
  }
  
  try {
    listPurchases();
  } catch (err) {
    showError("Error al inicializar la página");
  }
  
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => window.location.href = "purchase-register.html";
  }
  
  const addUserButton = document.getElementById("addUserButton");
  if (addUserButton) {
    addUserButton.onclick = () => window.location.href = "purchase-register.html";
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchPurchase);
  }
}

function initializeRegisterPage() {
  productItems = [];
  
  try {
    loadProducts();
    loadProviders();
  } catch (err) {
    showError("Error al cargar datos iniciales. Por favor, recargue la página.");
  }
  
  const purchaseDateElement = document.getElementById("purchaseDate");
  if (purchaseDateElement) {
    const todayLocal = getTodayLocal();
    purchaseDateElement.value = todayLocal;
    purchaseDateElement.max = todayLocal;
  }
  
  const totalAmountElement = document.getElementById("totalAmount");
  if (totalAmountElement) {
    totalAmountElement.textContent = formatCurrency(0);
  }
  
  const productTotalElement = document.getElementById("product-total");
  if (productTotalElement) {
    productTotalElement.textContent = formatCurrency(0);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;
  
  initializeValidationEvents();
  
  if (isListPage) {
    initializeListPage();
  } else if (isRegisterPage) {
    initializeRegisterPage();
  }
});

window.validateField = validateField;
window.validateQuantity = validateQuantity;
window.validatePrice = validatePrice;
window.validateProvider = validateProvider;
window.validateProduct = validateProduct;
window.validateDate = validateDate;
window.clearValidationErrors = clearValidationErrors;
window.disableNativeBrowserValidation = disableNativeBrowserValidation;
window.deletePurchase = deletePurchase;
window.updatePurchaseStatus = updatePurchaseStatus;
window.reactivatePurchase = reactivatePurchase;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeDetailsModal = closeDetailsModal;
window.searchPurchase = searchPurchase;
window.addProductItem = addProductItem;
window.removeProductItem = removeProductItem;
window.viewPurchaseDetails = viewPurchaseDetails;
window.isNumber = isNumber;
window.updateProductTotal = updateProductTotal;
window.hideLoadingIndicator = hideLoadingIndicator;
window.registerPurchase = registerPurchase;
window.handleSwitchClick = handleSwitchClick;
window.CustomProductSelector = CustomProductSelector;
window.CustomProviderSelector = CustomProviderSelector;
window.customProductSelector = customProductSelector;
window.customProviderSelector = customProviderSelector;
window.formatPriceInput = formatPriceInput;
window.formatPriceOnInput = formatPriceOnInput;
window.parseColombianPrice = parseColombianPrice;
window.addThousandsSeparators = addThousandsSeparators;