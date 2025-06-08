const API_PURCHASES = "https://backend-yy4o.onrender.com/api/purchases";
const API_PRODUCTS = "https://backend-yy4o.onrender.com/api/products";
const API_PROVIDERS = "https://backend-yy4o.onrender.com/api/providers";

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
  return `$${parseFloat(amount).toLocaleString('es-CO')}`;
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
      showError(data.message || "No se pudo listar las compras.");
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
      
      if (productId) {
        productIdToNameMap[productId] = productName;
        
        const option = `<option value="${productId}" data-price="${prod.price || 0}">${productName}</option>`;
        if (productSelect) productSelect.innerHTML += option;
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
    
    const providerSelect = document.getElementById("provider");
    const editProviderSelect = document.getElementById("editProvider");
    
    if (providerSelect) {
      providerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar proveedor</option>`;
    }
    
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
        if (providerSelect) providerSelect.innerHTML += option;
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
  
  if (quantity <= 0) {
    showError("La cantidad debe ser mayor que cero");
    return;
  }
  
  if (purchasePrice <= 0) {
    showError("El precio debe ser mayor que cero");
    return;
  }
  
  const total = quantity * purchasePrice;
  const productName = productSelect.options[productSelect.selectedIndex].text;
  
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
  
  productSelect.selectedIndex = 0;
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
  const price = parseFloat(document.getElementById("purchasePrice").value) || 0;
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
  
  const providerSelect = document.getElementById("provider");
  const purchaseDateInput = document.getElementById("purchaseDate");
  
  const providerId = providerSelect.value;
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
      showSuccess("Compra registrada correctamente.")
      .then(() => {
        window.location.href = "purchases.html";
      });
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
    quantityInput.addEventListener("input", updateProductTotal);
  }
  
  const purchasePriceInput = document.getElementById("purchasePrice");
  if (purchasePriceInput) {
    purchasePriceInput.addEventListener("blur", () => validatePrice("purchasePrice"));
    purchasePriceInput.addEventListener("keypress", (evt) => isNumber(evt, true));
    purchasePriceInput.addEventListener("input", updateProductTotal);
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