const API_PURCHASES = "https://backend-yy4o.onrender.com/api/purchases";
const API_PRODUCTS = "https://backend-yy4o.onrender.com/api/products";
const API_PROVIDERS = "https://backend-yy4o.onrender.com/api/providers";

// Variables globales
let allPurchases = [];
let originalPurchases = [];
let currentPage = 1;
const rowsPerPage = 10;
let productItems = [];
let productIdToNameMap = {};
let providerIdToNameMap = {};

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

// Función para validar cantidad (número entero)
function validateQuantity(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "La cantidad es obligatoria.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!/^\d+$/.test(field.value.trim()) || parseInt(field.value.trim()) <= 0) {
    errorElement.textContent = "La cantidad debe ser un número entero mayor que cero.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar precio (número decimal)
function validatePrice(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El precio es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!/^\d+(\.\d+)?$/.test(field.value.trim()) || parseFloat(field.value.trim()) <= 0) {
    errorElement.textContent = "El precio debe ser un número mayor que cero.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar selección de proveedor
function validateProvider(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value) {
    errorElement.textContent = "Debe seleccionar un proveedor.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar selección de producto
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

// Desactivar validación nativa del navegador en los formularios
function disableNativeBrowserValidation() {
  // Desactivar validación del formulario de registro
  const purchaseForm = document.getElementById("purchaseForm");
  if (purchaseForm) {
    purchaseForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = purchaseForm.querySelectorAll("input, select");
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
    const inputs = editForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
  
  // Desactivar validación del formulario de reportes
  const reportForm = document.getElementById("reportForm");
  if (reportForm) {
    reportForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = reportForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
}

// Obtener permisos de usuario
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

// Validar que solo se ingresen números
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

// Gestión de modales
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = "flex";
  
  // Limpiar mensajes de error al abrir el modal
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
      purchaseDateElement.value = new Date().toISOString().split('T')[0];
    }
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
  } else if (modalId === 'reportModal') {
    clearValidationErrors('reportForm');
    
    // Establecer fechas predeterminadas: último mes
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    const formatInputDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    const reportStartDateElement = document.getElementById("reportStartDate");
    const reportEndDateElement = document.getElementById("reportEndDate");
    
    if (reportStartDateElement) {
      reportStartDateElement.value = formatInputDate(lastMonth);
    }
    
    if (reportEndDateElement) {
      reportEndDateElement.value = formatInputDate(today);
    }
    
    // Cargar listas desplegables para productos y proveedores
    loadReportDropdowns();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = "none";
}

// Formateo de datos
const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  } catch (e) {
    return dateString;
  }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "No disponible";
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(amount);
  } catch (e) {
    return amount.toString();
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

// Listar compras
const listPurchases = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    // Mostrar indicador de carga para informar al usuario
    Swal.fire({
      title: 'Cargando compras',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const res = await fetch(API_PURCHASES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    // Ocultar indicador de carga
    Swal.close();
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al listar compras.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      showError("Error al procesar la respuesta del servidor. Formato inválido.");
      return;
    }
    
    // Verificar si data es un objeto con propiedad 'purchases'
    if (data && typeof data === 'object' && data.purchases) {
      originalPurchases = data.purchases;
    } 
    // Verificar si data es un array
    else if (Array.isArray(data)) {
      originalPurchases = data;
    } 
    // Si no es ninguno de los anteriores, verificar si hay alguna propiedad que sea un array
    else if (data && typeof data === 'object') {
      // Buscar la primera propiedad que sea un array
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        originalPurchases = data[arrayProps[0]];
      } else {
        // Si no hay arrays, crear uno vacío
        originalPurchases = [];
      }
    } else {
      originalPurchases = [];
    }
    
    if (!Array.isArray(originalPurchases)) {
      originalPurchases = [];
    }
    
    // Normalizar los campos para manejar diferentes formatos de respuesta API
    originalPurchases = originalPurchases.map(purchase => {
      let adaptedPurchase = {...purchase};
      
      // Verificar si es un objeto válido
      if (!adaptedPurchase || typeof adaptedPurchase !== 'object') {
        return {}; // Retornar objeto vacío para evitar errores
      }
      
      // Adaptación de nombres de campos
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
      
      return adaptedPurchase;
    }).filter(purchase => purchase && typeof purchase === 'object' && Object.keys(purchase).length > 0);
    
    allPurchases = [...originalPurchases];
    currentPage = 1;
    
    // Carga de datos complementarios (nombres de productos y proveedores)
    await loadProducts();
    await loadProviders();
    
    // Renderizar tabla
    renderPurchasesTable(currentPage);
    
    // Si la tabla sigue vacía después de renderizar, mostrar mensaje
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
    Swal.close();
    showError("Error al listar compras: " + (err.message || err));
  }
};

// Renderizar tabla de compras
const renderPurchasesTable = (page = 1) => {
  const tbody = document.getElementById("purchaseTableBody");
  
  if (!tbody) {
    return;
  }
  
  // Limpiar el tbody antes de renderizar
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
      
      // Obtener nombre del proveedor
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
      
      tableContent += `
        <tr data-id="${purchaseId}" data-index="${index}">
          <td class="id-column">${displayId}</td>
          <td>${providerName}</td>
          <td>${formatDate(purchaseDate)}</td>
          <td>${formatCurrency(purchase.total)}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                ${canEditPurchases ? `onchange="updatePurchaseStatus('${purchaseId}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="viewPurchaseDetails('${purchaseId}')" class="icon-button view-button" title="Ver detalles">
                <i class="material-icons">visibility</i>
              </button>
              <button onclick="fillEditForm('${purchaseId}')" class="icon-button edit-button" title="Editar" ${canEditPurchases ? '' : 'disabled'}>
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deletePurchase('${purchaseId}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_purchases") ? '' : 'disabled'}>
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
            Error al renderizar esta compra: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  // Asignar contenido de la tabla
  tbody.innerHTML = tableContent;

  // Renderizar controles de paginación
  renderPaginationControls();
};

// Controles de paginación
const renderPaginationControls = () => {
  if (!allPurchases || allPurchases.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allPurchases.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info");
  
  if (!container) return;

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

// Cargar datos
const loadProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
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
      showError(data.message || "Error al cargar productos.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      return;
    }
    
    let products = [];
    
    // Determinar estructura de respuesta y extraer datos
    if (data && typeof data === 'object' && data.products) {
      products = data.products;
    } else if (Array.isArray(data)) {
      products = data;
    } else if (data && typeof data === 'object') {
      // Buscar la primera propiedad que sea un array
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
    const reportProductSelect = document.getElementById("reportProduct");
    
    if (productSelect) {
      productSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar producto</option>`;
    }
    
    if (editProductSelect) {
      editProductSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar producto</option>`;
    }
    
    if (reportProductSelect) {
      reportProductSelect.innerHTML = `<option value="">Todos los productos</option>`;
    }
    
    productIdToNameMap = {};
    products.forEach(prod => {
      if (!prod || typeof prod !== 'object') return;
      
      const productId = prod._id;
      const productName = prod.name || 'Sin nombre';
      
      if (productId) {
        productIdToNameMap[productId] = productName;
        
        const option = `<option value="${productId}" data-price="${prod.price || 0}">${productName}</option>`;
        if (productSelect) productSelect.innerHTML += option;
        if (editProductSelect) editProductSelect.innerHTML += option;
        if (reportProductSelect) reportProductSelect.innerHTML += option;
      }
    });
  } catch (err) {
    showError("Error al cargar productos: " + (err.message || err));
  }
};

const loadProviders = async () => {
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
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar proveedores.");
      return;
    }
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      return;
    }
    
    let providers = [];
    
    // Determinar estructura de respuesta y extraer datos
    if (data && typeof data === 'object' && data.providers) {
      providers = data.providers;
    } else if (Array.isArray(data)) {
      providers = data;
    } else if (data && typeof data === 'object') {
      // Buscar la primera propiedad que sea un array
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        providers = data[arrayProps[0]];
      }
    }
    
    if (!Array.isArray(providers)) {
      providers = [];
    }
    
    const providerSelect = document.getElementById("provider");
    const editProviderSelect = document.getElementById("editProvider");
    const reportProviderSelect = document.getElementById("reportProvider");
    
    if (providerSelect) {
      providerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar proveedor</option>`;
    }
    
    if (editProviderSelect) {
      editProviderSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar proveedor</option>`;
    }
    
    if (reportProviderSelect) {
      reportProviderSelect.innerHTML = `<option value="">Todos los proveedores</option>`;
    }
    
    providerIdToNameMap = {};
    providers.forEach(prov => {
      if (!prov || typeof prov !== 'object') return;
      
      const providerId = prov._id;
      const providerName = prov.company || prov.name || 'Sin nombre';
      
      if (providerId) {
        providerIdToNameMap[providerId] = providerName;
        
        const option = `<option value="${providerId}">${providerName}</option>`;
        if (providerSelect) providerSelect.innerHTML += option;
        if (editProviderSelect) editProviderSelect.innerHTML += option;
        if (reportProviderSelect) reportProviderSelect.innerHTML += option;
      }
    });
 } catch (err) {
    showError("Error al cargar proveedores: " + (err.message || err));
  }
};

// Gestión de productos en formulario
const addProductItem = () => {
  const productSelect = document.getElementById("product");
  const quantityInput = document.getElementById("quantity");
  const purchasePriceInput = document.getElementById("purchasePrice");
  
  if (!productSelect || !quantityInput || !purchasePriceInput) {
    showError("Error: No se pudieron encontrar los campos del formulario");
    return;
  }
  
  const productValid = validateProduct("product");
  const quantityValid = validateQuantity("quantity");
  const priceValid = validatePrice("purchasePrice");
  
  if (!productValid || !quantityValid || !priceValid) {
    return;
  }
  
  const productId = productSelect.value;
  const quantity = parseInt(quantityInput.value);
  const purchasePrice = parseFloat(purchasePriceInput.value);
  const total = quantity * purchasePrice;
  const productName = productSelect.options[productSelect.selectedIndex].text;
  
  productItems.push({
    product: productId,
    quantity: quantity,
    purchase_price: purchasePrice,
    total: total,
    name: productName
  });
  
  updateProductItemsList();
  
  productSelect.value = "";
  quantityInput.value = "1";
  purchasePriceInput.value = "";
  
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
  const container = document.getElementById("productItemsList");
  if (!container) return;
  
  if (productItems.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay productos agregados</p>';
    return;
  }
  
  let html = '<div class="product-items">';
  productItems.forEach((item, index) => {
    html += `
      <div class="product-item">
        <div class="product-item-info">
          <span class="product-name">${item.name}</span>
          <div class="product-details">
            <span>Cantidad: ${item.quantity}</span>
            <span>Precio: ${formatCurrency(item.purchase_price)}</span>
            <span>Total: ${formatCurrency(item.total)}</span>
          </div>
        </div>
        <button type="button" onclick="removeProductItem(${index})" class="btn-remove">
          <i class="material-icons">close</i>
        </button>
      </div>
    `;
  });
  html += '</div>';
  
  container.innerHTML = html;
  
  // Ocultar mensaje de error si hay productos
  const errorElement = document.getElementById("productItemsList-error");
  if (errorElement) {
    errorElement.style.display = "none";
  }
};

// Función para ver detalles de compra con modal personalizado
const viewPurchaseDetails = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  try {
    // Mostrar indicador de carga
    showLoadingIndicator();
    
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    hideLoadingIndicator();

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los detalles de la compra.");
      return;
    }

    const purchase = await res.json();
    
    // Obtener nombre del proveedor
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
    
    // Obtener fecha formateada
    const purchaseDate = formatDate(purchase.purchase_date || purchase.fecha_compra || purchase.purchaseDate);
    
    // Obtener total formateado
    const totalFormatted = formatCurrency(purchase.total);
    
    // Estado de la compra
    const status = purchase.status || purchase.estado || "active";
    
    // Normalizar estructura de productos
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
    
    // Crear tabla HTML de productos
    let productsTableHtml = '<p class="no-data">No hay productos en esta compra</p>';
    
    // Crear tabla HTML si hay productos
    if (products.length > 0) {
      productsTableHtml = `
        <div class="details-table-wrapper">
          <table class="details-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
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
      
      // Agregar fila de total al final
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
    
    // Crear el HTML para un modal personalizado
    const detailsModalHtml = `
      <div id="detailsModal" class="custom-modal">
        <div class="custom-modal-content">
          <div class="custom-modal-header">
            <h3>Detalles de Compra: ${purchase.id || purchase._id || ""}</h3>
            <span class="close-button" onclick="closeDetailsModal()">&times;</span>
          </div>
          
          <div class="custom-modal-body">
            <div class="purchase-detail-content">
              <div class="purchase-info-column">
                <div class="info-group">
                  <h4>Información General</h4>
                  <div class="info-row">
                    <span class="info-label">Proveedor:</span>
                    <span class="info-value">${providerName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Fecha:</span>
                    <span class="info-value">${purchaseDate}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">
                      <label class="switch">
                        <input type="checkbox" ${status === "active" ? "checked" : ""} disabled>
                        <span class="slider"></span>
                      </label>
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Total:</span>
                    <span class="info-value total-value">${totalFormatted}</span>
                  </div>
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
    
    // Eliminar cualquier modal anterior si existe
    const existingModal = document.getElementById('detailsModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Añadir el nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', detailsModalHtml);
    
    // Mostrar el modal
    document.getElementById('detailsModal').style.display = 'flex';
    
    // Añadir evento para cerrar el modal al hacer clic fuera del contenido
    const modal = document.getElementById('detailsModal');
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeDetailsModal();
      }
    });
    
  } catch (err) {
    hideLoadingIndicator();
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Registrar compra
const registerPurchase = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
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
  
  const providerSelect = document.getElementById("provider");
  const purchaseDateInput = document.getElementById("purchaseDate");
  
  const providerId = providerSelect.value;
  const purchaseDate = purchaseDateInput.value;
  
  const statusElement = document.getElementById("status");
  const status = statusElement ? (statusElement.checked ? "active" : "inactive") : "active";

  const total = productItems.reduce((sum, item) => sum + item.total, 0);

  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Registrando compra',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const res = await fetch(API_PURCHASES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        provider: providerId,
        products: productItems,
        purchase_date: purchaseDate,
        total: total,
        status: status
      })
    });
    
    Swal.close();
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al registrar compra.");
      return;
    }
    
    const data = await res.json();
    showSuccess(data.message || "Compra registrada correctamente.");
    closeModal('registerModal');
    
    const purchaseForm = document.getElementById("purchaseForm");
    if (purchaseForm) {
      purchaseForm.reset();
    }
    
    productItems = [];
    updateProductItemsList();
    listPurchases();
  } catch (err) {
    Swal.close();
    showError("Error al registrar compra: " + (err.message || err));
  }
};

// Editar compra
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const confirmed = await showConfirm({
    title: "¿Deseas editar esta compra?",
    text: "Vas a modificar la información de esta compra.",
    confirmText: "Editar",
    cancelText: "Cancelar",
  });

  if (!confirmed) {
    Swal.fire({
      icon: "info",
      title: "Operación cancelada",
      text: "No se editará esta compra",
    });
    return;
  }

  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Cargando datos',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    Swal.close();

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos de la compra.");
      return;
    }

    const purchase = await res.json();
    
    // Verificar elementos del formulario
    const editIdElement = document.getElementById("editId");
    const editProviderElement = document.getElementById("editProvider");
    const editPurchaseDateElement = document.getElementById("editPurchaseDate");
    const editStatusElement = document.getElementById("editStatus");
    
    if (!editIdElement || !editProviderElement || !editPurchaseDateElement) {
      showError("No se encontraron todos los campos del formulario de edición");
      return;
    }
    
    // Obtener valores de campos
    const purchaseId = purchase._id;
    const providerId = purchase.provider?._id || purchase.provider || purchase.proveedor?._id || purchase.proveedor;
    const purchaseDate = (purchase.purchase_date || purchase.fecha_compra || purchase.purchaseDate)?.split('T')[0] || "";
    const status = purchase.status || purchase.estado || "active";
    
    editIdElement.value = purchaseId;
    editProviderElement.value = providerId;
    editPurchaseDateElement.value = purchaseDate;
    
    if (editStatusElement) {
      editStatusElement.checked = status === "active";
    }
    
    // Limpiar cualquier error previo
    clearValidationErrors('editForm');
    
    // Advertir sobre limitaciones de edición
    Swal.fire({
      icon: "info",
      title: "Edición limitada",
      text: "Por motivos de integridad del inventario, solo puedes editar el proveedor, la fecha y el estado de la compra. Para modificar productos, deberás eliminar esta compra y crear una nueva.",
    });

    openModal("editModal");
  } catch (err) {
    Swal.close();
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar compra
const updatePurchase = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const providerValid = validateProvider("editProvider");
  const dateValid = validateDate("editPurchaseDate");
  
  if (!providerValid || !dateValid) {
    return;
  }

  const editIdElement = document.getElementById("editId");
  const editProviderElement = document.getElementById("editProvider");
  const editPurchaseDateElement = document.getElementById("editPurchaseDate");
  const editStatusElement = document.getElementById("editStatus");

  const purchaseId = editIdElement.value;
  const provider = editProviderElement.value;
  const purchase_date = editPurchaseDateElement.value;
  const status = editStatusElement ? (editStatusElement.checked ? "active" : "inactive") : "active";

  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Actualizando compra',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const res = await fetch(`${API_PURCHASES}/${purchaseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        provider, 
        purchase_date,
        status
      }),
    });
    
    Swal.close();
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al actualizar la compra.");
      return;
    }

    const data = await res.json();
    showSuccess(data.message || "Compra actualizada correctamente.");
    closeModal("editModal");
    
    const editForm = document.getElementById("editForm");
    if (editForm) {
      editForm.reset();
    }
    
    listPurchases();
  } catch (err) {
    Swal.close();
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar estado de compra
const updatePurchaseStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Actualizando estado',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      timer: 500
    });
    
    const res = await fetch(`${API_PURCHASES}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    Swal.close();
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Compra ${status === 'active' ? 'activada' : 'desactivada'} correctamente.`,
        showConfirmButton: false,
        timer: 1500
      });
      
      listPurchases();
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} la compra (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
      listPurchases();
    }
  } catch (err) {
    Swal.close();
    showError(`Ocurrió un error de red: ${err.message || err}`);
    listPurchases();
  }
};

// Eliminar compra
const deletePurchase = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar esta compra?",
    text: "Esta acción no se puede deshacer y reducirá el stock de los productos asociados.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });
  
  if (!confirmed) return;

  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Eliminando compra',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    Swal.close();
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo eliminar la compra");
      return;
    }
    
    showSuccess("Compra eliminada correctamente y stock actualizado.");
    listPurchases();
  } catch (err) {
    Swal.close();
    showError("Error al eliminar compra: " + (err.message || err));
  }
};

// Buscar compra
const searchPurchase = () => {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalPurchases) return;
  
  if (!term) {
    allPurchases = [...originalPurchases];
  } else {
    allPurchases = originalPurchases.filter(p => {
      // Buscar en proveedor
      const providerMatch = 
        (p.provider?.company && p.provider.company.toLowerCase().includes(term)) ||
        (p.proveedor?.company && p.proveedor.company.toLowerCase().includes(term));
      
      // Buscar en productos
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
      
      // Buscar en ID
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

// ===== FUNCIONES PARA INFORMES =====
const openReportModal = () => {
  clearValidationErrors('reportForm');
  
  // Establecer fechas predeterminadas: último mes
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  
  const formatInputDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  const reportStartDateElement = document.getElementById("reportStartDate");
  const reportEndDateElement = document.getElementById("reportEndDate");
  
  if (reportStartDateElement) {
    reportStartDateElement.value = formatInputDate(lastMonth);
  }
  
  if (reportEndDateElement) {
    reportEndDateElement.value = formatInputDate(today);
  }
  
  // Cargar listas desplegables para productos y proveedores
  loadReportDropdowns();
  
  openModal("reportModal");
};

// Cargar las listas desplegables para el formulario de reportes
const loadReportDropdowns = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;
  
  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Cargando datos',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      timer: 500
    });
    
    // Cargar productos
    const productElement = document.getElementById("reportProduct");
    if (productElement) {
      const productsResponse = await fetch(`${API_PRODUCTS}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        
        // Limpiar opciones existentes
        productElement.innerHTML = '<option value="">Todos los productos</option>';
        
        // Determinar la estructura de la respuesta
        let products = [];
        if (Array.isArray(productsData)) {
          products = productsData;
        } else if (productsData && typeof productsData === 'object' && productsData.products) {
          products = productsData.products;
        }
        
        // Agregar productos activos
        if (Array.isArray(products)) {
          products
            .filter(product => product && product.status === 'active')
            .forEach(product => {
              const option = document.createElement('option');
              option.value = product._id;
              option.textContent = product.name;
              productElement.appendChild(option);
            });
        }
      }
    }
    
    // Cargar proveedores
    const providerElement = document.getElementById("reportProvider");
    if (providerElement) {
      const providersResponse = await fetch(`${API_PROVIDERS}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        
        // Limpiar opciones existentes
        providerElement.innerHTML = '<option value="">Todos los proveedores</option>';
        
        // Determinar la estructura de la respuesta
        let providers = [];
        if (Array.isArray(providersData)) {
          providers = providersData;
        } else if (providersData && typeof providersData === 'object' && providersData.providers) {
          providers = providersData.providers;
        }
        
        // Agregar proveedores activos
        if (Array.isArray(providers)) {
          providers
            .filter(provider => provider && provider.status === 'active')
            .forEach(provider => {
              const option = document.createElement('option');
              option.value = provider._id;
              option.textContent = provider.company || provider.name;
              providerElement.appendChild(option);
            });
        }
      }
    }
    
    Swal.close();
  } catch (error) {
    Swal.close();
  }
};

// Validar formulario de reportes
function validateReportForm() {
  const startDateInput = document.getElementById("reportStartDate");
  const endDateInput = document.getElementById("reportEndDate");
  
  let isValid = true;
  
  if (!startDateInput.value.trim()) {
    const errorElement = document.getElementById("reportStartDate-error");
    errorElement.textContent = "La fecha de inicio es obligatoria.";
    errorElement.style.display = "block";
    startDateInput.classList.add("input-error");
    isValid = false;
  } else {
    const errorElement = document.getElementById("reportStartDate-error");
    errorElement.style.display = "none";
    startDateInput.classList.remove("input-error");
  }
  
  if (!endDateInput.value.trim()) {
    const errorElement = document.getElementById("reportEndDate-error");
    errorElement.textContent = "La fecha de fin es obligatoria.";
    errorElement.style.display = "block";
    endDateInput.classList.add("input-error");
    isValid = false;
  } else {
    const errorElement = document.getElementById("reportEndDate-error");
    errorElement.style.display = "none";
    endDateInput.classList.remove("input-error");
  }
  
  // Validar que la fecha de inicio no sea posterior a la de fin
  if (startDateInput.value && endDateInput.value) {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    if (startDate > endDate) {
      const errorElement = document.getElementById("reportStartDate-error");
      errorElement.textContent = "La fecha de inicio no puede ser posterior a la fecha de fin.";
      errorElement.style.display = "block";
      startDateInput.classList.add("input-error");
      isValid = false;
    }
  }
  
  return isValid;
}

// Generar PDF - Alineado con el backend
const generatePdfReport = async () => {
  if (!validateReportForm()) {
    return;
  }
  
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  // Mostrar indicador de carga
  Swal.fire({
    title: 'Generando reporte',
    text: 'Por favor espere mientras se genera el PDF',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  try {
    // Obtener valores de filtros (exactamente como el backend)
    const reportStartDateElement = document.getElementById("reportStartDate");
    const reportEndDateElement = document.getElementById("reportEndDate");
    const reportProductElement = document.getElementById("reportProduct");
    const reportProviderElement = document.getElementById("reportProvider");
    const reportStatusElement = document.getElementById("reportStatus");
    
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const productId = reportProductElement?.value || '';
    const providerId = reportProviderElement?.value || '';
    const status = reportStatusElement?.value || '';
    
    // Construir URL con parámetros (exactamente como el backend)
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    
    // Solo agregar si son ObjectIds válidos (como en el backend)
    if (productId && isValidObjectId(productId)) {
      params.append("productId", productId);
    }
    
    if (providerId && isValidObjectId(providerId)) {
      params.append("providerId", providerId);
    }
    
    if (status && ['active', 'inactive'].includes(status)) {
      params.append("status", status);
    }
    
    const url = `${API_PURCHASES}/export/pdf?${params.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      let errorMessage = `Error: ${response.status} - ${response.statusText}`;
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        // Error al procesar respuesta de error
      }
      
      throw new Error(errorMessage);
    }
    
    // Obtener el blob del archivo
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error("El archivo generado está vacío. Verifique los filtros seleccionados.");
    }
    
    // Crear URL del objeto y forzar la descarga
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `reporte-compras-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    Swal.close();
    showSuccess("Reporte PDF generado exitosamente. El archivo contiene detalles de productos para cada compra.");
  } catch (error) {
    Swal.close();
    showError(`Error al generar el reporte: ${error.message}`);
  }
  
  closeModal("reportModal");
};

// Generar Excel - Alineado con el backend
const generateExcelReport = async () => {
  if (!validateReportForm()) {
    return;
  }
  
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  // Mostrar indicador de carga
  Swal.fire({
    title: 'Generando reporte',
    text: 'Por favor espere mientras se genera el archivo Excel',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  try {
    // Obtener valores de filtros (exactamente como el backend)
    const reportStartDateElement = document.getElementById("reportStartDate");
    const reportEndDateElement = document.getElementById("reportEndDate");
    const reportProductElement = document.getElementById("reportProduct");
    const reportProviderElement = document.getElementById("reportProvider");
    const reportStatusElement = document.getElementById("reportStatus");
    
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const productId = reportProductElement?.value || '';
    const providerId = reportProviderElement?.value || '';
    const status = reportStatusElement?.value || '';
    
    // Construir URL con parámetros (exactamente como el backend)
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    
    // Solo agregar si son ObjectIds válidos (como en el backend)
    if (productId && isValidObjectId(productId)) {
      params.append("productId", productId);
    }
    
    if (providerId && isValidObjectId(providerId)) {
      params.append("providerId", providerId);
    }
    
    if (status && ['active', 'inactive'].includes(status)) {
      params.append("status", status);
    }
    
    const url = `${API_PURCHASES}/export/excel?${params.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      let errorMessage = `Error: ${response.status} - ${response.statusText}`;
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        // Error al procesar respuesta de error
      }
      
      throw new Error(errorMessage);
    }
    
    // Obtener el blob del archivo
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error("El archivo generado está vacío. Verifique los filtros seleccionados.");
    }
    
    // Crear URL del objeto y forzar la descarga
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `reporte-compras-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    Swal.close();
    showSuccess("Reporte Excel generado exitosamente. El archivo incluye una hoja de detalles de productos.");
  } catch (error) {
    Swal.close();
    showError(`Error al generar el reporte: ${error.message}`);
  }
  
  closeModal("reportModal");
};

// Validar formato de ID de MongoDB (exactamente como el backend)
const isValidObjectId = (id) => {
  // Implementación similar a mongoose.Types.ObjectId.isValid()
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};

// Verificar autenticación
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

// Inicializar eventos y validaciones
function initializeValidationEvents() {
  // Desactivar validación nativa del navegador
  disableNativeBrowserValidation();
  
  // Validación para el formulario de registro de compras
  const providerSelect = document.getElementById("provider");
  if (providerSelect) {
    providerSelect.addEventListener("change", () => validateProvider("provider"));
  }
  
  const purchaseDateInput = document.getElementById("purchaseDate");
  if (purchaseDateInput) {
    purchaseDateInput.addEventListener("blur", () => validateDate("purchaseDate"));
  }
  
  const productSelect = document.getElementById("product");
  if (productSelect) {
    productSelect.addEventListener("change", () => validateProduct("product"));
  }
  
  const quantityInput = document.getElementById("quantity");
  if (quantityInput) {
    quantityInput.addEventListener("blur", () => validateQuantity("quantity"));
    quantityInput.addEventListener("keypress", (evt) => isNumber(evt));
  }
  
  const purchasePriceInput = document.getElementById("purchasePrice");
  if (purchasePriceInput) {
    purchasePriceInput.addEventListener("blur", () => validatePrice("purchasePrice"));
    purchasePriceInput.addEventListener("keypress", (evt) => isNumber(evt, true));
  }
  
  // Validación para el formulario de edición de compras
  const editProviderSelect = document.getElementById("editProvider");
  if (editProviderSelect) {
    editProviderSelect.addEventListener("change", () => validateProvider("editProvider"));
  }
  
  const editPurchaseDateInput = document.getElementById("editPurchaseDate");
  if (editPurchaseDateInput) {
    editPurchaseDateInput.addEventListener("blur", () => validateDate("editPurchaseDate"));
  }
  
  // Validación para el formulario de reportes
  const reportStartDateInput = document.getElementById("reportStartDate");
  if (reportStartDateInput) {
    reportStartDateInput.addEventListener("blur", () => validateDate("reportStartDate"));
  }
  
  const reportEndDateInput = document.getElementById("reportEndDate");
  if (reportEndDateInput) {
    reportEndDateInput.addEventListener("blur", () => validateDate("reportEndDate"));
  }
  
  // Configurar eventos de formularios
  const purchaseForm = document.getElementById("purchaseForm");
  if (purchaseForm) {
    purchaseForm.onsubmit = (event) => {
      event.preventDefault();
      registerPurchase();
    };
  }
  
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = (event) => {
      event.preventDefault();
      updatePurchase();
    };
  }
  
  const reportForm = document.getElementById("reportForm");
  if (reportForm) {
    reportForm.onsubmit = (event) => {
      event.preventDefault();
    };
  }
  
  // Configurar botones
  const addProductButton = document.getElementById("addProductButton");
  if (addProductButton) {
    addProductButton.addEventListener("click", function(event) {
      event.preventDefault();
      addProductItem();
    });
  }
}

// Función para cerrar el modal de detalles
const closeDetailsModal = () => {
  const modal = document.getElementById('detailsModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;
  
  // Inicializar validaciones
  initializeValidationEvents();
  
  // Cargar datos iniciales
  listPurchases();
  
  // Configurar eventos de UI
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
  }
  
  const addUserButton = document.getElementById("addUserButton");
  if (addUserButton) {
    addUserButton.onclick = () => openModal('registerModal');
  }
  
  const reportButton = document.getElementById("reportButton");
  if (reportButton) {
    reportButton.onclick = openReportModal;
  }
  
  const pdfReportButton = document.getElementById("pdfReportButton");
  if (pdfReportButton) {
    pdfReportButton.onclick = generatePdfReport;
  }
  
  const excelReportButton = document.getElementById("excelReportButton");
  if (excelReportButton) {
    excelReportButton.onclick = generateExcelReport;
  }
  
  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.onclick = registerPurchase;
  }
  
  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.onclick = updatePurchase;
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchPurchase);
  }
});

// Funciones globales
window.validateField = validateField;
window.validateQuantity = validateQuantity;
window.validatePrice = validatePrice;
window.validateProvider = validateProvider;
window.validateProduct = validateProduct;
window.validateDate = validateDate;
window.clearValidationErrors = clearValidationErrors;
window.disableNativeBrowserValidation = disableNativeBrowserValidation;
window.fillEditForm = fillEditForm;
window.deletePurchase = deletePurchase;
window.updatePurchase = updatePurchase;
window.updatePurchaseStatus = updatePurchaseStatus;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeDetailsModal = closeDetailsModal;
window.searchPurchase = searchPurchase;
window.openReportModal = openReportModal;
window.generatePdfReport = generatePdfReport;
window.generateExcelReport = generateExcelReport;
window.addProductItem = addProductItem;
window.removeProductItem = removeProductItem;
window.viewPurchaseDetails = viewPurchaseDetails;
window.isNumber = isNumber;
window.validateReportForm = validateReportForm;