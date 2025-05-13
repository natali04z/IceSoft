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
  
  if (modalId === "registerModal") {
    productItems = [];
    updateProductItemsList();
    
    const purchaseDateElement = document.getElementById("purchaseDate");
    if (purchaseDateElement) {
      purchaseDateElement.value = new Date().toISOString().split('T')[0];
    }
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

// Renderizar tabla de compras
const renderPurchasesTable = (page = 1) => {
  const tbody = document.getElementById("purchaseTableBody");
  
  if (!tbody) return;
  
  tbody.innerHTML = "";

  if (!allPurchases || allPurchases.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay compras disponibles</td></tr>`;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const purchasesToShow = allPurchases.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditPurchases = userPermissions.includes("edit_purchases");

  purchasesToShow.forEach(purchase => {
    const purchaseId = purchase._id || "";
    const displayId = purchase.id || purchaseId;
    
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
    
    // Mostrar productos con sus cantidades y precios
    let productDisplay = "Sin productos";
    if (purchase.products && Array.isArray(purchase.products) && purchase.products.length > 0) {
      const productInfo = purchase.products.map(item => {
        let productName;
        if (item.product && typeof item.product === 'object') {
          if (item.product.name) {
            productName = item.product.name;
          } else {
            productName = getProductNameById(item.product._id);
          }
        } else {
          productName = getProductNameById(item.product);
        }
        return `<div class="product-item-inline">
                  <span class="product-name">${productName}</span>
                  <span class="product-details">
                    <span>Cant: ${item.quantity}</span>
                    <span>Precio: ${formatCurrency(item.purchase_price)}</span>
                  </span>
                </div>`;
      }).join("");
      productDisplay = `<div class="product-list">${productInfo}</div>`;
    } else if (purchase.productos && Array.isArray(purchase.productos) && purchase.productos.length > 0) {
      const productInfo = purchase.productos.map(item => {
        let productName;
        if (item.producto && typeof item.producto === 'object') {
          if (item.producto.name) {
            productName = item.producto.name;
          } else {
            productName = getProductNameById(item.producto._id);
          }
        } else {
          productName = getProductNameById(item.producto);
        }
        return `<div class="product-item-inline">
                  <span class="product-name">${productName}</span>
                  <span class="product-details">
                    <span>Cant: ${item.cantidad}</span>
                    <span>Precio: ${formatCurrency(item.precio_compra)}</span>
                  </span>
                </div>`;
      }).join("");
      productDisplay = `<div class="product-list">${productInfo}</div>`;
    }
    
    const purchaseDate = purchase.purchase_date || purchase.fecha_compra || purchase.purchaseDate;
    const status = purchase.status || purchase.estado || "active";
    
    tbody.innerHTML += `
      <tr>
        <td>${displayId}</td>
        <td>${providerName}</td>
        <td>${productDisplay}</td>
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
  });

  renderPaginationControls();
};

// Actualizar estado de compra
const updatePurchaseStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  try {
    const res = await fetch(`${API_PURCHASES}/${id}/status`, {
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
    showError(`Ocurrió un error de red: ${err.message || err}`);
    listPurchases();
  }
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
    
    const data = await res.json();
    const products = data.products || data;
    
    const productSelect = document.getElementById("product");
    const editProductSelect = document.getElementById("editProduct");
    const reportProductSelect = document.getElementById("reportProduct");
    
    if (!productSelect && !editProductSelect && !reportProductSelect) {
      return;
    }
    
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
      productIdToNameMap[prod._id] = prod.name;
      
      const option = `<option value="${prod._id}" data-price="${prod.price || 0}">${prod.name}</option>`;
      if (productSelect) productSelect.innerHTML += option;
      if (editProductSelect) editProductSelect.innerHTML += option;
      if (reportProductSelect) reportProductSelect.innerHTML += option;
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
    
    const data = await res.json();
    const providers = data.providers || data;
    
    const providerSelect = document.getElementById("provider");
    const editProviderSelect = document.getElementById("editProvider");
    const reportProviderSelect = document.getElementById("reportProvider");
    
    if (!providerSelect && !editProviderSelect && !reportProviderSelect) {
      return;
    }
    
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
      providerIdToNameMap[prov._id] = prov.name;
      
      const option = `<option value="${prov._id}">${prov.name}</option>`;
      if (providerSelect) providerSelect.innerHTML += option;
      if (editProviderSelect) editProviderSelect.innerHTML += option;
      if (reportProviderSelect) reportProviderSelect.innerHTML += option;
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
  
  const productId = productSelect.value;
  if (!productId) {
    showValidation("Debe seleccionar un producto");
    return;
  }
  
  const quantity = parseInt(quantityInput.value);
  if (isNaN(quantity) || quantity <= 0) {
    showValidation("La cantidad debe ser un número mayor que cero");
    return;
  }
  
  const purchasePrice = parseFloat(purchasePriceInput.value);
  if (isNaN(purchasePrice) || purchasePrice <= 0) {
    showValidation("El precio de compra debe ser un número mayor que cero");
    return;
  }
  
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
};

// Ver detalles de compra
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
    
    // Crear contenido HTML para el modal de detalles
    let productsHtml = '<p>No hay productos en esta compra</p>';
    
    if (purchase.products && purchase.products.length > 0) {
      productsHtml = '<table class="details-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Compra</th><th>Subtotal</th></tr></thead><tbody>';
      
      purchase.products.forEach(item => {
        let productName;
        if (item.product && typeof item.product === 'object') {
          if (item.product.name) {
            productName = item.product.name;
          } else {
            productName = getProductNameById(item.product._id);
          }
        } else {
          productName = getProductNameById(item.product);
        }
        
        const price = item.purchase_price || 0;
        const quantity = item.quantity || 0;
        const total = item.total || price * quantity;
        
        productsHtml += `
          <tr>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(price)}</td>
            <td>${formatCurrency(total)}</td>
          </tr>
        `;
      });
      
      productsHtml += '</tbody></table>';
    } else if (purchase.productos && purchase.productos.length > 0) {
      productsHtml = '<table class="details-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Compra</th><th>Subtotal</th></tr></thead><tbody>';
      
      purchase.productos.forEach(item => {
        let productName;
        if (item.producto && typeof item.producto === 'object') {
          if (item.producto.name) {
            productName = item.producto.name;
          } else {
            productName = getProductNameById(item.producto._id);
          }
        } else {
          productName = getProductNameById(item.producto);
        }
        
        const price = item.precio_compra || 0;
        const quantity = item.cantidad || 0;
        const total = item.total || price * quantity;
        
        productsHtml += `
          <tr>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(price)}</td>
            <td>${formatCurrency(total)}</td>
          </tr>
        `;
      });
      
      productsHtml += '</tbody></table>';
    }
    
    // Estado de la compra
    const status = purchase.status || purchase.estado || "active";
    const statusHtml = `
      <p><strong>Estado:</strong> <span class="status-badge ${status === 'active' ? 'status-active' : 'status-inactive'}">${status === 'active' ? 'Activo' : 'Inactivo'}</span></p>
    `;
    
    // Mostrar modal con Sweet Alert
    Swal.fire({
      title: `Detalles de compra: ${purchase.id || ""}`,
      html: `
        <div class="purchase-details">
          <div class="details-section">
            <h4>Información General</h4>
            <p><strong>Proveedor:</strong> ${providerName}</p>
            <p><strong>Fecha:</strong> ${formatDate(purchase.purchase_date || purchase.fecha_compra || purchase.purchaseDate)}</p>
            <p><strong>Total:</strong> ${formatCurrency(purchase.total)}</p>
            ${statusHtml}
          </div>
          
          <div class="details-section">
            <h4>Productos</h4>
            ${productsHtml}
          </div>
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Cerrar',
      customClass: {
        container: 'purchase-details-modal'
      }
    });
  } catch (err) {
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
  
  if (productItems.length === 0) {
    showValidation("Debe agregar al menos un producto a la compra.");
    return;
  }
  
  const providerSelect = document.getElementById("provider");
  const purchaseDateInput = document.getElementById("purchaseDate");
  
  if (!providerSelect || !purchaseDateInput) {
    showError("No se encontraron los campos del formulario");
    return;
  }
  
  const providerId = providerSelect.value;
  if (!providerId) {
    showValidation("Debe seleccionar un proveedor");
    return;
  }
  
  const purchaseDate = purchaseDateInput.value;
  if (!purchaseDate) {
    showValidation("La fecha de compra es obligatoria");
    return;
  }
  
  const statusElement = document.getElementById("status");
  const status = statusElement ? (statusElement.checked ? "active" : "inactive") : "active";

  const total = productItems.reduce((sum, item) => sum + item.total, 0);

  try {
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
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

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
    
    // Advertir sobre limitaciones de edición
    Swal.fire({
      icon: "info",
      title: "Edición limitada",
      text: "Por motivos de integridad del inventario, solo puedes editar el proveedor, la fecha y el estado de la compra. Para modificar productos, deberás eliminar esta compra y crear una nueva.",
    });

    openModal("editModal");
  } catch (err) {
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

  const editIdElement = document.getElementById("editId");
  const editProviderElement = document.getElementById("editProvider");
  const editPurchaseDateElement = document.getElementById("editPurchaseDate");
  const editStatusElement = document.getElementById("editStatus");
  
  if (!editIdElement || !editProviderElement || !editPurchaseDateElement) {
    showError("No se encontraron todos los campos del formulario de edición");
    return;
  }

  const purchaseId = editIdElement.value;
  const provider = editProviderElement.value;
  const purchase_date = editPurchaseDateElement.value;
  const status = editStatusElement ? (editStatusElement.checked ? "active" : "inactive") : "active";

  if (!provider || !purchase_date) {
    showError("Todos los campos son obligatorios.");
    return;
  }

  try {
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
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Listar compras
const listPurchases = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
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
      showError(data.message || "Error al listar compras.");
      return;
    }
    
    const data = await res.json();
    
    originalPurchases = Array.isArray(data) ? data : [];
    
    // Normalizar los campos
    originalPurchases = originalPurchases.map(purchase => {
      let adaptedPurchase = {...purchase};
      
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
    });
    
    allPurchases = [...originalPurchases];
    currentPage = 1;
    renderPurchasesTable(currentPage);
  } catch (err) {
    showError("Error al listar compras: " + (err.message || err));
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
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo eliminar la compra");
      return;
    }
    
    showSuccess("Compra eliminada correctamente y stock actualizado.");
    listPurchases();
  } catch (err) {
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
    // Cargar productos
    const productElement = document.getElementById("reportProduct");
    if (productElement) {
      const productsResponse = await fetch(`${API_PRODUCTS}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        
        // Limpiar opciones existentes
        productElement.innerHTML = '<option value="">All products</option>';
        
        // Agregar productos activos
        products
          .filter(product => product.status === 'active')
          .forEach(product => {
            const option = document.createElement('option');
            option.value = product._id;
            option.textContent = product.name;
            productElement.appendChild(option);
          });
      }
    }
    
    // Cargar proveedores
    const providerElement = document.getElementById("reportProvider");
    if (providerElement) {
      const providersResponse = await fetch(`${API_PROVIDERS}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (providersResponse.ok) {
        const providers = await providersResponse.json();
        
        // Limpiar opciones existentes
        providerElement.innerHTML = '<option value="">All providers</option>';
        
        // Agregar proveedores activos
        providers
          .filter(provider => provider.status === 'active')
          .forEach(provider => {
            const option = document.createElement('option');
            option.value = provider._id;
            option.textContent = provider.company;
            providerElement.appendChild(option);
          });
      }
    }
  } catch (error) {
    console.error("Error loading report data:", error);
  }
};

// Generar PDF - Alineado con el backend
const generatePdfReport = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token not found. Please log in again.");
    return;
  }
  
  // Mostrar indicador de carga
  Swal.fire({
    title: 'Generating report...',
    text: 'Please wait while the PDF is being generated',
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
    
    if (!reportStartDateElement || !reportEndDateElement) {
      throw new Error("Report form elements not found");
    }
    
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const productId = reportProductElement?.value || '';
    const providerId = reportProviderElement?.value || '';
    const status = reportStatusElement?.value || '';
    
    // Validar fechas (exactamente como el backend)
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error("Start date cannot be later than end date");
    }
    
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
        console.error("Error processing error response:", e);
      }
      
      throw new Error(errorMessage);
    }
    
    // Obtener el blob del archivo
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error("Generated file is empty. Check the selected filters.");
    }
    
    // Crear URL del objeto y forzar la descarga
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `purchases-report-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    Swal.close();
    showSuccess("PDF report generated successfully. The file contains product details for each purchase.");
  } catch (error) {
    Swal.close();
    showError(`Error generating report: ${error.message}`);
  }
  
  closeModal("reportModal");
};

// Generar Excel - Alineado con el backend
const generateExcelReport = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token not found. Please log in again.");
    return;
  }
  
  // Mostrar indicador de carga
  Swal.fire({
    title: 'Generating report...',
    text: 'Please wait while the Excel file is being generated',
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
    
    if (!reportStartDateElement || !reportEndDateElement) {
      throw new Error("Report form elements not found");
    }
    
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const productId = reportProductElement?.value || '';
    const providerId = reportProviderElement?.value || '';
    const status = reportStatusElement?.value || '';
    
    // Validar fechas (exactamente como el backend)
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error("Start date cannot be later than end date");
    }
    
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
        console.error("Error processing error response:", e);
      }
      
      throw new Error(errorMessage);
    }
    
    // Obtener el blob del archivo
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error("Generated file is empty. Check the selected filters.");
    }
    
    // Crear URL del objeto y forzar la descarga
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `purchases-report-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    Swal.close();
    showSuccess("Excel report generated successfully. The file includes a product details worksheet.");
  } catch (error) {
    Swal.close();
    showError(`Error generating report: ${error.message}`);
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

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;
  
  // Cargar datos iniciales
  listPurchases();
  loadProducts();
  loadProviders();
  
  // Configurar eventos de UI
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
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
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchPurchase);
  }

  // Validar entradas numéricas
  const quantityInput = document.getElementById("quantity");
  if (quantityInput) {
    quantityInput.onkeypress = (evt) => isNumber(evt);
  }
  
  const purchasePriceInput = document.getElementById("purchasePrice");
  if (purchasePriceInput) {
    purchasePriceInput.onkeypress = (evt) => isNumber(evt, true);
  }

  // Configurar botón para añadir productos
  const addProductButton = document.getElementById("addProductButton");
  if (addProductButton) {
    addProductButton.addEventListener("click", function(event) {
      event.preventDefault();
      addProductItem();
    });
  }

  // Configurar formulario de edición
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updatePurchase();
    };
  }
});

// Funciones globales
window.fillEditForm = fillEditForm;
window.deletePurchase = deletePurchase;
window.updatePurchase = updatePurchase;
window.updatePurchaseStatus = updatePurchaseStatus;
window.openModal = openModal;
window.closeModal = closeModal;
window.searchPurchase = searchPurchase;
window.openReportModal = openReportModal;
window.generatePdfReport = generatePdfReport;
window.generateExcelReport = generateExcelReport;
window.addProductItem = addProductItem;
window.removeProductItem = removeProductItem;
window.viewPurchaseDetails = viewPurchaseDetails;
window.isNumber = isNumber;