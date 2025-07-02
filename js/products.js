const API_PRODUCTS = "https://backend-alpha-orpin-58.vercel.app/api/products";
const API_CATEGORIES = "https://backend-alpha-orpin-58.vercel.app/api/categories";

// Variables globales para productos y paginación
let allProducts = [];
let originalProducts = [];
let currentPage = 1;
const rowsPerPage = 10;

// ===== FUNCIONES HELPER PARA FECHAS =====

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
      return dateObj.toLocaleDateString('es-CO');
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-CO');
  } catch (e) {
    return date.toString();
  }
}

// ===== FUNCIONES DE VALIDACIÓN =====

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

// Función para validar precio
function validatePrice(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  const price = parseColombianPrice(field.value);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El precio es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (isNaN(price) || price <= 0) {
    errorElement.textContent = "El precio debe ser un número mayor que cero.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!Number.isInteger(price)) {
    errorElement.textContent = "El precio debe ser un número entero.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar stock
function validateStock(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  const stock = parseInt(field.value);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El stock es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (isNaN(stock) || stock < 0) {
    errorElement.textContent = "El stock debe ser un número entero no negativo.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar fecha
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

// Función para validar categoría
function validateCategory(fieldId) {
  // Obtener valor del selector (personalizado o nativo)
  let fieldValue = '';
  let inputElement = null;
  
  if (fieldId === 'category') {
    // Formulario de registro
    if (customCategorySelector) {
      fieldValue = customCategorySelector.getValue();
      inputElement = document.getElementById('categorySearch');
    } else {
      const field = document.getElementById('category');
      fieldValue = field ? field.value : '';
      inputElement = field;
    }
  } else if (fieldId === 'editCategory') {
    // Formulario de edición
    if (customEditCategorySelector) {
      fieldValue = customEditCategorySelector.getValue();
      inputElement = document.getElementById('editCategorySearch');
    } else {
      const field = document.getElementById('editCategory');
      fieldValue = field ? field.value : '';
      inputElement = field;
    }
  }
  
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!fieldValue) {
    if (errorElement) {
      errorElement.textContent = "Debe seleccionar una categoría.";
      errorElement.style.display = "block";
    }
    if (inputElement) {
      inputElement.classList.add("input-error");
    }
    return false;
  } else {
    if (errorElement) {
      errorElement.style.display = "none";
    }
    if (inputElement) {
      inputElement.classList.remove("input-error");
    }
    return true;
  }
}

// Función para validar fechas relacionadas (fecha de lote y expiración)
function validateDateRange(batchDateId, expirationDateId) {
  const batchDateField = document.getElementById(batchDateId);
  const expirationDateField = document.getElementById(expirationDateId);
  const expirationErrorElement = document.getElementById(`${expirationDateId}-error`);
  
  if (batchDateField.value && expirationDateField.value) {
    const batchDate = new Date(batchDateField.value);
    const expirationDate = new Date(expirationDateField.value);
    
    if (batchDate >= expirationDate) {
      expirationErrorElement.textContent = "La fecha de expiración debe ser posterior a la fecha de lote.";
      expirationErrorElement.style.display = "block";
      expirationDateField.classList.add("input-error");
      return false;
    } else {
      expirationErrorElement.style.display = "none";
      expirationDateField.classList.remove("input-error");
      return true;
    }
  }
  
  return true;
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

function disableNativeBrowserValidation() {
  const productForm = document.getElementById("productForm");
  if (productForm) {
    productForm.setAttribute("novalidate", "");
    
    const inputs = productForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
    });
  }

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.setAttribute("novalidate", "");
    
    const inputs = editForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
    });
  }
}

// ===== CLASES DE SELECTORES PERSONALIZADOS =====

// Instancias globales de los selectores personalizados
let customCategorySelector = null;
let customEditCategorySelector = null;

// Clase para manejar el selector personalizado de categorías (registro)
class CustomCategorySelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById('categorySearch');
    this.hiddenInput = document.getElementById('category');
    this.dropdown = document.getElementById('categoryDropdown');
    this.searchInput = document.getElementById('categorySearchInput');
    this.optionsContainer = document.getElementById('categoryOptions');
    this.categories = [];
    this.filteredCategories = [];
    this.selectedCategory = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Event listeners
    this.input.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.filterCategories(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setCategories(categories) {
    this.categories = categories.map(category => ({
      id: category._id,
      name: category.name || 'Sin nombre'
    }));
    this.filteredCategories = [...this.categories];
    this.renderOptions();
  }

  filterCategories(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = this.categories.filter(category => 
        category.name.toLowerCase().includes(term)
      );
    }
    
    this.renderOptions();
  }

  renderOptions() {
    if (this.filteredCategories.length === 0) {
      this.optionsContainer.innerHTML = '<div class="custom-select-no-results">No se encontraron categorías</div>';
      return;
    }

    const optionsHTML = this.filteredCategories.map(category => 
      `<div class="custom-select-option" data-id="${category.id}">
        ${category.name}
      </div>`
    ).join('');

    this.optionsContainer.innerHTML = optionsHTML;

    // Agregar event listeners a las opciones
    this.optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => this.selectOption(option));
    });
  }

  selectOption(optionElement) {
    const categoryId = optionElement.dataset.id;
    const categoryName = optionElement.textContent.trim();

    // Actualizar valores
    this.selectedCategory = { id: categoryId, name: categoryName };
    this.input.value = categoryName;
    this.hiddenInput.value = categoryId;

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
    this.filteredCategories = [...this.categories];
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
    const errorElement = document.getElementById('category-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.input.classList.remove('input-error');
  }

  reset() {
    this.selectedCategory = null;
    this.input.value = '';
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    this.filteredCategories = [...this.categories];
    this.renderOptions();
    this.close();
  }

  getValue() {
    return this.hiddenInput.value;
  }

  setValue(categoryId) {
    const category = this.categories.find(c => c.id === categoryId);
    if (category) {
      this.selectedCategory = category;
      this.input.value = category.name;
      this.hiddenInput.value = categoryId;
    }
  }

  getSelectedCategory() {
    return this.selectedCategory;
  }
}

// Clase para manejar el selector personalizado de categorías (edición)
class CustomEditCategorySelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById('editCategorySearch');
    this.hiddenInput = document.getElementById('editCategory');
    // En productos solo tenemos selector personalizado, no hay nativo
    this.dropdown = document.getElementById('editCategoryDropdown');
    this.searchInput = document.getElementById('editCategorySearchInput');
    this.optionsContainer = document.getElementById('editCategoryOptions');
    this.categories = [];
    this.filteredCategories = [];
    this.selectedCategory = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Event listeners
    this.input.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.filterCategories(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setCategories(categories) {
    this.categories = categories.map(category => ({
      id: category._id,
      name: category.name || 'Sin nombre'
    }));
    this.filteredCategories = [...this.categories];
    this.renderOptions();
  }

  filterCategories(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = this.categories.filter(category => 
        category.name.toLowerCase().includes(term)
      );
    }
    
    this.renderOptions();
  }

  renderOptions() {
    if (this.filteredCategories.length === 0) {
      this.optionsContainer.innerHTML = '<div class="custom-select-no-results">No se encontraron categorías</div>';
      return;
    }

    const optionsHTML = this.filteredCategories.map(category => 
      `<div class="custom-select-option" data-id="${category.id}">
        ${category.name}
      </div>`
    ).join('');

    this.optionsContainer.innerHTML = optionsHTML;

    // Agregar event listeners a las opciones
    this.optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => this.selectOption(option));
    });
  }

  selectOption(optionElement) {
    const categoryId = optionElement.dataset.id;
    const categoryName = optionElement.textContent.trim();

    // Actualizar valores
    this.selectedCategory = { id: categoryId, name: categoryName };
    this.input.value = categoryName;
    this.hiddenInput.value = categoryId;

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
    this.filteredCategories = [...this.categories];
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
    const errorElement = document.getElementById('editCategory-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.input.classList.remove('input-error');
  }

  reset() {
    this.selectedCategory = null;
    this.input.value = '';
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    this.filteredCategories = [...this.categories];
    this.renderOptions();
    this.close();
  }

  getValue() {
    return this.hiddenInput.value;
  }

  setValue(categoryId) {
    console.log('CustomEditCategorySelector setValue llamado con:', categoryId);
    console.log('Categorías disponibles:', this.categories);
    
    if (!Array.isArray(this.categories)) {
      console.log('Categorías no es array, inicializando...');
      this.categories = [];
    }
    
    if (!categoryId) {
      console.log('No hay categoryId, resetear selector');
      this.reset();
      return;
    }
    
    const category = this.categories.find(c => c.id === categoryId);
    console.log('Categoría encontrada:', category);
    
    if (category) {
      this.selectedCategory = category;
      this.input.value = category.name;
      this.hiddenInput.value = categoryId;
      
      console.log('Valor establecido correctamente:', {
        input: this.input.value,
        hidden: this.hiddenInput.value
      });
    } else {
      console.warn('Categoría no encontrada con ID:', categoryId);
      // Si no se encuentra, resetear
      this.reset();
    }
  }

  getSelectedCategory() {
    return this.selectedCategory;
  }
}

// ===== FUNCIONES DE UTILIDAD =====

// Función para abrir un modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = "flex";

  if (modalId === 'registerModal') {
    clearValidationErrors('productForm');
    
    const productForm = document.getElementById("productForm");
    if (productForm) {
      productForm.reset();
    }
    
    // Resetear selector personalizado de categoría
    if (customCategorySelector) customCategorySelector.reset();
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
    
    // NO resetear selector en modal de edición ya que se establece en fillEditForm
    // Los valores se establecen específicamente en fillEditForm()
    console.log('Abriendo modal de edición - NO resetear selectores');
  }
}

// Función para cerrar un modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = "none";
}

// Función para obtener permisos de usuario
function getUserPermissions() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return ['edit_products', 'delete_products'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['edit_products', 'delete_products'];
  } catch (error) {
    return ['edit_products', 'delete_products'];
  }
}

function hideLoadingIndicator() {
  Swal.close();
}

// ===== FUNCIONES DE FORMATEO =====

// Formatear precio en formato colombiano
const formatPrice = (price) => {
  if (!price) return "$0";
  
  const num = parseFloat(price);
  if (isNaN(num)) return "$0";
  
  // Si es un número entero, no mostrar decimales
  if (num % 1 === 0) {
    return `$${Math.round(num).toLocaleString('es-CO')}`;
  } else {
    // Si tiene decimales, mostrar máximo 2 decimales
    return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

// Usando la función helper para DD/MM/YYYY
const formatDate = (dateString) => {
  return formatDateForDisplay(dateString);
};

// ===== FUNCIONES DE RENDERIZADO =====

// Renderizar tabla de productos con la estructura mejorada
const renderProductsTable = (page = 1) => {
  const tbody = document.getElementById("productTableBody");
  
  if (!tbody) {
    return;
  }
  
  tbody.innerHTML = "";

  if (!allProducts || allProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">
          No hay productos disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const productsToShow = allProducts.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditProducts = userPermissions.includes("edit_products");
  
  let tableContent = '';

  productsToShow.forEach((product, index) => {
    try {
      const productId = product._id || "";
      const displayId = product.id || productId || `Pr${String(index + 1).padStart(2, '0')}`;
      
      // Usando la función helper para formatear fechas
      const formattedBatchDate = formatDate(product.batchDate);
      const formattedExpirationDate = formatDate(product.expirationDate);
      const formattedPrice = product.formattedPrice || formatPrice(product.price);
      const status = product.status || "active";
      
      tableContent += `
        <tr data-productid="${productId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${product.name || ''}</td>
          <td>${product.category?.name || ''}</td>
          <td>${formattedPrice}</td>
          <td>${product.stock || 0}</td>
          <td>${formattedBatchDate}</td>
          <td>${formattedExpirationDate}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                ${canEditProducts ? `onchange="updateProductStatus('${productId}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${productId}')" class="icon-button edit-button" title="Editar" ${canEditProducts ? '' : 'disabled'}>
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deleteProduct('${productId}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_products") ? '' : 'disabled'}>
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="9" class="text-center text-danger">
            Error al renderizar este producto: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  renderPaginationControls();
};

// Renderizar controles de paginación
const renderPaginationControls = () => {
  if (!allProducts || allProducts.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allProducts.length / rowsPerPage);
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
    const startItem = allProducts.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allProducts.length);
    info.innerHTML = `${startItem}-${endItem} de ${allProducts.length}`;
  }
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderProductsTable(currentPage);
};

// ===== FUNCIONES DE CARGA DE DATOS =====

const loadCategories = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente");
      return;
    }
    const res = await fetch(API_CATEGORIES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      const categories = data.categories || data;
      const categorySelect = document.getElementById("category");
      const editCategorySelect = document.getElementById("editCategory");

      if (!categorySelect || !editCategorySelect) {
        return;
      }

      categorySelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar categoría</option>`;
      editCategorySelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar categoría</option>`;
      
      categories.forEach(cat => {
        const option = `<option value="${cat._id}">${cat.name}</option>`;
        categorySelect.innerHTML += option;
        editCategorySelect.innerHTML += option;
      });
      
      // Inicializar selectores personalizados si los contenedores existen
      if (document.getElementById('categorySelectContainer')) {
        customCategorySelector = new CustomCategorySelector('categorySelectContainer');
        customCategorySelector.setCategories(categories);
      }
      
      if (document.getElementById('editCategorySelectContainer')) {
        customEditCategorySelector = new CustomEditCategorySelector('editCategorySelectContainer');
        customEditCategorySelector.setCategories(categories);
      }
    } else {
      showError(data.message || "No se pudo listar las categorías.");
    }
  } catch (err) {
    showError("Error al listar las categorías.");
  }
};

const loadProductsInternal = async () => {
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
      showError(data.message || "No se pudo listar los productos.");
      return;
    }
    
    const data = await res.json();
    
    // Simplificar el procesamiento de datos
    let products = [];
    
    if (data.products) {
      products = data.products;
    } else if (Array.isArray(data)) {
      products = data;
    }
    
    // Procesar productos
    originalProducts = products.map(product => ({
      ...product,
      formattedPrice: formatPrice(product.price),
      status: product.status || "active"
    }));
    
    allProducts = [...originalProducts];
    currentPage = 1;
    
    // Mostrar alertas de productos próximos a vencer si existen
    if (data.expiringProductsAlert && typeof showWarning === 'function') {
      showWarning(data.expiringProductsAlert.message);
    }
    
    renderProductsTable(currentPage);
    
  } catch (err) {
    showError("Error al listar los productos");
  }
};

// Listar productos con indicador de carga (solo para carga inicial)
const listProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    showLoadingIndicator();
    
    const res = await fetch(API_PRODUCTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    hideLoadingIndicator();
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo listar los productos.");
      return;
    }
    
    const data = await res.json();
    
    // Simplificar el procesamiento de datos
    let products = [];
    
    if (data.products) {
      products = data.products;
    } else if (Array.isArray(data)) {
      products = data;
    }
    
    // Procesar productos
    originalProducts = products.map(product => ({
      ...product,
      formattedPrice: formatPrice(product.price),
      status: product.status || "active"
    }));
    
    allProducts = [...originalProducts];
    currentPage = 1;
    
    // Mostrar alertas de productos próximos a vencer si existen
    if (data.expiringProductsAlert && typeof showWarning === 'function') {
      showWarning(data.expiringProductsAlert.message);
    }
    
    renderProductsTable(currentPage);
    
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar los productos");
  }
};

// ===== FUNCIONES DE OPERACIONES CRUD =====

// Registrar producto - VERSIÓN ACTUALIZADA
const registerProduct = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const nameValid = validateField("name", "El nombre es obligatorio.");
  const categoryValid = validateCategory("category");
  const priceValid = validatePrice("price");
  const batchDateValid = validateDate("batchDate");
  const expirationDateValid = validateDate("expirationDate");
  const dateRangeValid = validateDateRange("batchDate", "expirationDate");

  // ⭐ NUEVO: Validar stock solo si se proporciona
  const stockField = document.getElementById("stock");
  let stockValid = true;
  if (stockField && stockField.value.trim()) {
    stockValid = validateStock("stock");
  }

  if (!nameValid || !categoryValid || !priceValid || !batchDateValid || !expirationDateValid || !dateRangeValid || !stockValid) {
    return;
  }
  
  const name = document.getElementById("name").value.trim();
  
  // Obtener categoría del selector personalizado o nativo
  let category = '';
  if (customCategorySelector) {
    category = customCategorySelector.getValue();
  } else {
    const categoryField = document.getElementById("category");
    category = categoryField ? categoryField.value : '';
  }
  
  const price = parseColombianPrice(document.getElementById("price").value);
  const batchDate = document.getElementById("batchDate").value;
  const expirationDate = document.getElementById("expirationDate").value;

  const requestBody = { 
    name, 
    category, 
    price, 
    batchDate,
    expirationDate
  };

  // Solo agregar stock si se proporciona
  if (stockField && stockField.value.trim()) {
    const stock = parseInt(stockField.value);
    if (!isNaN(stock) && stock >= 0) {
      requestBody.stock = stock;
    }
  }

  try {
    const res = await fetch(API_PRODUCTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    const data = await res.json();
    if (res.status === 201 || res.ok) {
      showSuccess('El producto ha sido registrado');
      
      // Mostrar alerta de vencimiento si existe
      if (data.expirationAlert && typeof showWarning === 'function') {
        showWarning(data.expirationAlert.message);
      }
      
      closeModal('registerModal');
      
      const productForm = document.getElementById("productForm");
      if (productForm) {
        productForm.reset();
      }
      
      loadProductsInternal();
    } else {
      showError(data.message || "No se pudo registrar el producto.");
    }
  } catch (err) {
    showError("Error al registrar el producto");
  }
};

// Llenar formulario de edición de producto - VERSIÓN ACTUALIZADA
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  try {
    clearValidationErrors('editForm');
    
    const res = await fetch(`${API_PRODUCTS}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos del producto.");
      return;
    }

    const product = await res.json();
    document.getElementById("editId").value = product._id;
    document.getElementById("editName").value = product.name || "";
    
    // Establecer categoría (selector personalizado o nativo)
    if (product.category?._id) {
      const categoryId = product.category._id;
      
      if (customEditCategorySelector) {
        // Intentar establecer el valor con reintentos
        const setValueWithRetry = (attempts = 0) => {
          console.log(`Intento ${attempts + 1} de establecer valor en selector personalizado:`, categoryId);
          
          if (customEditCategorySelector && Array.isArray(customEditCategorySelector.categories) && customEditCategorySelector.categories.length > 0) {
            customEditCategorySelector.setValue(categoryId);
          } else if (attempts < 3) {
            console.log('Categorías aún no cargadas, reintentando...');
            setTimeout(() => setValueWithRetry(attempts + 1), 200);
          } else {
            console.error('No se pudo establecer el valor después de varios intentos');
          }
        };
        
        setTimeout(() => setValueWithRetry(), 200);
      } else {
        const editCategoryField = document.getElementById("editCategory");
        if (editCategoryField) {
          editCategoryField.value = categoryId;
        }
      }
    } else {
      if (customEditCategorySelector) {
        customEditCategorySelector.reset();
      } else {
        const editCategoryField = document.getElementById("editCategory");
        if (editCategoryField) {
          editCategoryField.value = "";
        }
      }
    }
    
    document.getElementById("editPrice").value = product.price || "";
    
    const editStockField = document.getElementById("editStock");
    if (editStockField) {
      editStockField.value = product.stock || "";
    }
   
    // Manejo de fechas mejorado
    if (product.batchDate) {
      // Si viene en formato ISO, convertir a YYYY-MM-DD para el input
      const batchDate = new Date(product.batchDate);
      if (!isNaN(batchDate.getTime())) {
        document.getElementById("editBatchDate").value = batchDate.toISOString().split('T')[0];
      }
    }
    
    if (product.expirationDate) {
      // Si viene en formato ISO, convertir a YYYY-MM-DD para el input
      const expirationDate = new Date(product.expirationDate);
      if (!isNaN(expirationDate.getTime())) {
        document.getElementById("editExpirationDate").value = expirationDate.toISOString().split('T')[0];
      }
    }

    // Mostrar alerta de vencimiento si existe
    if (product.expirationAlert && typeof showWarning === 'function') {
      showWarning(product.expirationAlert.message);
    }

    openModal("editModal");
  } catch (err) {
    showError("Error al cargar el producto.");
  }
};

// Actualizar producto - VERSIÓN ACTUALIZADA
const updateProduct = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente");
    return;
  }

  const nameValid = validateField("editName", "El nombre es obligatorio.");
  const categoryValid = validateCategory("editCategory");
  const priceValid = validatePrice("editPrice");
  const batchDateValid = validateDate("editBatchDate");
  const expirationDateValid = validateDate("editExpirationDate");
  const dateRangeValid = validateDateRange("editBatchDate", "editExpirationDate");

  const editStockField = document.getElementById("editStock");
  let stockValid = true;
  if (editStockField && editStockField.value.trim()) {
    stockValid = validateStock("editStock");
  }

  if (!nameValid || !categoryValid || !priceValid || !batchDateValid || !expirationDateValid || !dateRangeValid || !stockValid) {
    return;
  }

  const productId = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  
  // Obtener categoría del selector personalizado o nativo
  let category = '';
  if (customEditCategorySelector) {
    category = customEditCategorySelector.getValue();
  } else {
    const categoryField = document.getElementById("editCategory");
    category = categoryField ? categoryField.value : '';
  }
  
  const price = parseColombianPrice(document.getElementById("editPrice").value);
  const batchDate = document.getElementById("editBatchDate").value;
  const expirationDate = document.getElementById("editExpirationDate").value;

  const requestBody = { 
    name, 
    category, 
    price,
    batchDate,
    expirationDate
  };

  // Solo agregar stock si se proporciona
  if (editStockField && editStockField.value.trim()) {
    const stock = parseInt(editStockField.value);
    if (!isNaN(stock) && stock >= 0) {
      requestBody.stock = stock;
    }
  }

  try {
    const res = await fetch(`${API_PRODUCTS}/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (res.ok) {
      let successMessage = 'El producto ha sido actualizado';
      
      if (data.stockChange) {
        successMessage += `. ${data.stockChange.message}`;
      }
      
      showSuccess(successMessage);
      
      // Mostrar alerta de vencimiento si existe
      if (data.expirationAlert && typeof showWarning === 'function') {
        showWarning(data.expirationAlert.message);
      }
      
      closeModal("editModal");
      
      const editForm = document.getElementById("editForm");
      if (editForm) {
        editForm.reset();
      }
      
      loadProductsInternal();
    } else {
      showError(data.message || "No se pudo actualizar el producto.");
    }
  } catch (err) {
    showError("Error al actualizar el producto.");
  }
};

// Actualizar solo el estado de un producto usando la ruta existente
const updateProductStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const switchElement = document.querySelector(`tr[data-productid="${id}"] input[type="checkbox"]`);
  
  try {
    const res = await fetch(`${API_PRODUCTS}/${id}/status`, {
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
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      showSuccess(`El producto ha sido ${status === 'active' ? 'activado' : 'desactivado'}`);

      if (switchElement) {
        switchElement.checked = status === 'active';
      }

      // Mostrar advertencia si el producto fue desactivado
      if (data.warning && typeof showWarning === 'function') {
        showWarning(data.warning);
      }

      // Actualizar el estado en los arrays de productos
      if (data.product) {
        const productIndex = allProducts.findIndex(p => p._id === id);
        if (productIndex !== -1) {
          allProducts[productIndex] = { ...allProducts[productIndex], ...data.product };
        }
        
        const originalIndex = originalProducts.findIndex(p => p._id === id);
        if (originalIndex !== -1) {
          originalProducts[originalIndex] = { ...originalProducts[originalIndex], ...data.product };
        }
      } else {
        // Fallback: solo actualizar el status
        const productIndex = allProducts.findIndex(p => p._id === id);
        if (productIndex !== -1) {
          allProducts[productIndex].status = status;
        }
        
        const originalIndex = originalProducts.findIndex(p => p._id === id);
        if (originalIndex !== -1) {
          originalProducts[originalIndex].status = status;
        }
      }
      
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} el producto (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);

      // Revertir el switch si hay error
      if (switchElement) {
        switchElement.checked = status !== 'active';
      }
    }
  } catch (err) {
    showError("Error de conexión al actualizar estado del producto");

    // Revertir el switch si hay error de conexión
    if (switchElement) {
      switchElement.checked = status !== 'active';
    }
  }
};

// Verificar el estado de un producto
const checkProductStatus = async (productId) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_PRODUCTS}/${productId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      if (data.status === "inactive") {
        showValidation('Este producto está desactivado y no puede ser utilizado.')
        return false;
      }
      return true;
    } else {
      showError(data.message || "Error al verificar estado del producto.");
      return false;
    }
  } catch (err) {
    showError("Error al verificar estado del producto");
    return false;
  }
};

// Eliminar producto
const deleteProduct = async (id) => {
  const token = localStorage.getItem("token");

  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar este producto?",
    text: "Esta acción no se puede deshacer.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });
  
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_PRODUCTS}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    if (res.ok) {
      showSuccess('El producto ha sido eliminado');
      loadProductsInternal();
    } else {
      showError(data.message || "No se pudo eliminar el producto");
    }
  } catch (err) {
    showError("Error al eliminar el producto");
  }
};

// Buscar producto
const searchProduct = () => {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalProducts) return;
  
  if (!term) {
    allProducts = [...originalProducts];
  } else {
    allProducts = originalProducts.filter(p => {
      const nameMatch = p.name && p.name.toLowerCase().includes(term);
      const categoryMatch = p.category?.name && p.category.name.toLowerCase().includes(term);
      const idMatch = p.id && p.id.toLowerCase().includes(term);
      
      return nameMatch || categoryMatch || idMatch;
    });
  }
  
  currentPage = 1;
  renderProductsTable(currentPage);
};

// ===== FUNCIONES DE UTILIDAD ADICIONALES =====

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

// ===== FUNCIONES DE INICIALIZACIÓN =====

function initializeValidationEvents() {
  disableNativeBrowserValidation();
  
  // Validación en tiempo real - Formulario de registro
  const nameField = document.getElementById("name");
  if (nameField) {
    nameField.addEventListener("blur", () => validateField("name", "El nombre es obligatorio."));
  }
  
  const categoryField = document.getElementById("category");
  if (categoryField) {
    categoryField.addEventListener("change", () => validateCategory("category"));
  }
  
  const priceField = document.getElementById("price");
  if (priceField) {
    priceField.addEventListener("input", () => formatPriceOnInput(priceField));
    priceField.addEventListener("blur", () => validatePrice("price"));
    priceField.addEventListener("keypress", (evt) => isNumber(evt));
  }

  const stockField = document.getElementById("stock");
  if (stockField) {
    stockField.addEventListener("blur", () => {
      if (stockField.value.trim()) {
        validateStock("stock");
      }
    });
  }
  
  const batchDateField = document.getElementById("batchDate");
  if (batchDateField) {
    batchDateField.addEventListener("change", () => {
      validateDate("batchDate");
      validateDateRange("batchDate", "expirationDate");
    });
  }
  
  const expirationDateField = document.getElementById("expirationDate");
  if (expirationDateField) {
    expirationDateField.addEventListener("change", () => {
      validateDate("expirationDate");
      validateDateRange("batchDate", "expirationDate");
    });
  }
  
  // Validación en tiempo real - Formulario de edición
  const editNameField = document.getElementById("editName");
  if (editNameField) {
    editNameField.addEventListener("blur", () => validateField("editName", "El nombre es obligatorio."));
  }
  
  const editCategoryField = document.getElementById("editCategory");
  if (editCategoryField) {
    editCategoryField.addEventListener("change", () => validateCategory("editCategory"));
  }
  
  const editPriceField = document.getElementById("editPrice");
  if (editPriceField) {
    editPriceField.addEventListener("input", () => formatPriceOnInput(editPriceField));
    editPriceField.addEventListener("blur", () => validatePrice("editPrice"));
    editPriceField.addEventListener("keypress", (evt) => isNumber(evt));
  }

  const editStockField = document.getElementById("editStock");
  if (editStockField) {
    editStockField.addEventListener("blur", () => {
      if (editStockField.value.trim()) {
        validateStock("editStock");
      }
    });
  }
  
  const editBatchDateField = document.getElementById("editBatchDate");
  if (editBatchDateField) {
    editBatchDateField.addEventListener("change", () => {
      validateDate("editBatchDate");
      validateDateRange("editBatchDate", "editExpirationDate");
    });
  }
  
  const editExpirationDateField = document.getElementById("editExpirationDate");
  if (editExpirationDateField) {
    editExpirationDateField.addEventListener("change", () => {
      validateDate("editExpirationDate");
      validateDateRange("editBatchDate", "editExpirationDate");
    });
  }
}

function initializeListPage() {
  const productTableBody = document.getElementById("productTableBody");
  if (!productTableBody) {
    return;
  }
  
  try {
    // Primero cargar productos y categorías
    listProducts();
    loadCategories();
  } catch (err) {
    showError("Error al inicializar la página");
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
    registerButton.onclick = registerProduct;
  }
  
  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.onclick = updateProduct;
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchProduct);
  }
}

// ===== EVENTOS AL CARGAR EL DOM =====

document.addEventListener("DOMContentLoaded", () => {
  console.log('Products.js DOMContentLoaded started');
  
  if (!checkAuth()) return;
  
  initializeValidationEvents();
  initializeListPage();
  
  
  // Inicializar notificaciones con debug
  setTimeout(() => {
      
      if (typeof window.ensureNotificationManager === 'function') {
          console.log('Calling ensureNotificationManager...');
          window.ensureNotificationManager();
      } else {
          console.error('ensureNotificationManager not found!');
      }
      
      if (typeof window.getExpirationNotifications === 'function') {
          window.getExpirationNotifications(7);
      } else {
          console.error('getExpirationNotifications not found!');
      }
  }, 1000);
});

// ===== FUNCIONES GLOBALES =====

window.validateField = validateField;
window.validatePrice = validatePrice;
window.validateStock = validateStock;
window.validateDate = validateDate;
window.validateCategory = validateCategory;
window.validateDateRange = validateDateRange;
window.clearValidationErrors = clearValidationErrors;
window.disableNativeBrowserValidation = disableNativeBrowserValidation;
window.fillEditForm = fillEditForm;
window.deleteProduct = deleteProduct;
window.openModal = openModal;
window.closeModal = closeModal;
window.updateProductStatus = updateProductStatus;
window.updateProduct = updateProduct;
window.checkProductStatus = checkProductStatus;
window.searchProduct = searchProduct;
window.hideLoadingIndicator = hideLoadingIndicator;
window.formatDateForDisplay = formatDateForDisplay;
window.isNumber = isNumber;
window.formatPriceInput = formatPriceInput;
window.formatPriceOnInput = formatPriceOnInput;
window.parseColombianPrice = parseColombianPrice;
window.addThousandsSeparators = addThousandsSeparators;