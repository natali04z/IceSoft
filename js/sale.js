const API_SALES = "https://backend-yy4o.onrender.com/api/sales";
const API_PRODUCTS = "https://backend-yy4o.onrender.com/api/products";
const API_CUSTOMERS = "https://backend-yy4o.onrender.com/api/customers";

// ===== VARIABLES GLOBALES =====
let allSales = [];
let originalSales = [];
let currentPage = 1;
const rowsPerPage = 10;
let productItems = [];
let productIdToNameMap = {};
let customerIdToNameMap = {};

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

function validatePrice(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El precio es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  }
  
  const price = parseFloat(field.value.trim());
  
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
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value) {
    errorElement.textContent = "Debe seleccionar un cliente.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

function validateProduct(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value) {
    errorElement.textContent = "Debe seleccionar un producto.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
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
  
  if (allowDecimals && charCode === 46 && evt.target.value.indexOf('.') === -1) {
    return true;
  }
  
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
  return `$${parseFloat(amount).toLocaleString('es-CO')}`;
};

const getProductNameById = (productId) => {
  if (!productId) return "Producto desconocido";
  return productIdToNameMap[productId] || "Producto no encontrado";
};

const getCustomerNameById = (customerId) => {
  if (!customerId) return "Cliente desconocido";
  return customerIdToNameMap[customerId] || "Cliente no encontrado";
};

const getStatusBadge = (status) => {
  const badges = {
    'processing': '<span class="status-badge processing">Procesando</span>',
    'completed': '<span class="status-badge completed">Completada</span>',
    'cancelled': '<span class="status-badge cancelled">Cancelada</span>'
  };
  return badges[status] || '<span class="status-badge processing">Procesando</span>';
};

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
    
    renderSalesTable(currentPage);
    
    const tbody = document.getElementById("salesTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
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
    
    renderSalesTable(currentPage);
    
    const tbody = document.getElementById("salesTableBody");
    if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
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
    products.forEach(prod => {
      if (!prod || typeof prod !== 'object') return;
      
      const productId = prod._id;
      const productName = prod.name || 'Sin nombre';
      const productPrice = prod.price || 0;
      
      if (productId) {
        productIdToNameMap[productId] = productName;
        
        const option = `<option value="${productId}" data-price="${productPrice}">${productName}</option>`;
        if (productSelect) productSelect.innerHTML += option;
        if (editProductSelect) editProductSelect.innerHTML += option;
      }
    });
    
    if (productSelect) {
      productSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        const salePriceInput = document.getElementById('salePrice');
        
        if (salePriceInput && price) {
          salePriceInput.value = parseFloat(price);
          updateProductTotal();
          validatePrice('salePrice');
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
    
  } catch (err) {
    showError("Error al listar los clientes: " + (err.message || err));
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
        <td colspan="6" class="text-center">
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
              <button onclick="deleteSale('${saleId}')" class="icon-button delete-button" title="Eliminar" ${canDelete ? '' : 'disabled'}>
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="6" class="text-center text-danger">
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
  const productSelect = document.getElementById("product");
  const quantityInput = document.getElementById("quantity");
  const salePriceInput = document.getElementById("salePrice");
  
  if (!productSelect || !quantityInput || !salePriceInput) {
    showError("Error: No se pudieron encontrar los campos del formulario");
    return;
  }
  
  const productValid = validateProduct("product");
  const quantityValid = validateQuantity("quantity");
  const priceValid = validatePrice("salePrice");
  
  if (!productValid || !quantityValid || !priceValid) {
    return;
  }
  
  const productId = productSelect.value;
  const quantity = parseInt(quantityInput.value);
  const salePrice = parseFloat(salePriceInput.value);
  
  if (quantity <= 0) {
    showError("La cantidad debe ser mayor que cero");
    return;
  }
  
  if (salePrice <= 0) {
    showError("El precio debe ser mayor que cero");
    return;
  }
  
  const total = quantity * salePrice;
  const productName = productSelect.options[productSelect.selectedIndex].text;
  
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
  productSelect.selectedIndex = 0;
  quantityInput.value = "1";
  salePriceInput.value = "";
  document.getElementById("product-total").textContent = formatCurrency(0);
  
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
  const price = parseFloat(document.getElementById("salePrice").value) || 0;
  const totalElement = document.getElementById("product-total");
  
  if (totalElement) {
    const total = quantity * price;
    totalElement.textContent = formatCurrency(total);
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
  const dateValid = validateDate("salesDate");
  
  if (!customerValid || !dateValid) {
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
  
  const customerSelect = document.getElementById("customer");
  const salesDateInput = document.getElementById("salesDate");
  
  const customerId = customerSelect.value;
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
      products: formattedProducts,
      sales_date: salesDate
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
      showSuccess("Venta registrada correctamente.")
      .then(() => {
        window.location.href = "sale.html";
      });
    } else {
      showSuccess("Venta registrada correctamente.");
      closeModal('registerModal');
      
      const saleForm = document.getElementById("saleForm");
      if (saleForm) {
        saleForm.reset();
      }
      
      productItems = [];
      updateProductItemsList();
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
    salePriceInput.addEventListener("blur", () => validatePrice("salePrice"));
    salePriceInput.addEventListener("keypress", (evt) => isNumber(evt, true));
    salePriceInput.addEventListener("input", updateProductTotal);
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
window.hideLoadingIndicator = hideLoadingIndicator;
window.onProductChange = onProductChange;