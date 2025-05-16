const API_SALES = "https://backend-yy4o.onrender.com/api/sales";
const API_PRODUCTS = "https://backend-yy4o.onrender.com/api/products";
const API_CUSTOMERS = "https://backend-yy4o.onrender.com/api/customers";

// Variables globales
let allSales = [];
let originalSales = [];
let currentPage = 1;
const rowsPerPage = 10;
let productItems = [];
let productIdToNameMap = {};
let customerIdToNameMap = {};

// Obtener permisos de usuario
function getUserPermissions() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return ['view_sales', 'create_sales', 'update_sales', 'delete_sales', 'update_status_sales'];
    
    const user = JSON.parse(userInfo);
    return user.permissions || ['view_sales', 'create_sales', 'update_sales', 'delete_sales', 'update_status_sales'];
  } catch (error) {
    return ['view_sales', 'create_sales', 'update_sales', 'delete_sales', 'update_status_sales'];
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
    
    const salesDateElement = document.getElementById("salesDate");
    if (salesDateElement) {
      salesDateElement.value = new Date().toISOString().split('T')[0];
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

const getCustomerNameById = (customerId) => {
  if (!customerId) return "Cliente desconocido";
  return customerIdToNameMap[customerId] || "Cliente no encontrado";
};

// Renderizar tabla de ventas
const renderSalesTable = (page = 1) => {
  const tbody = document.getElementById("saleTableBody");
  
  if (!tbody) return;
  
  tbody.innerHTML = "";

  if (!allSales || allSales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay ventas disponibles</td></tr>`;
    renderPaginationControls();
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const salesToShow = allSales.slice(start, end);

  const userPermissions = getUserPermissions();
  const canUpdateSales = userPermissions.includes("update_sales");
  const canUpdateStatusSales = userPermissions.includes("update_status_sales");

  salesToShow.forEach(sale => {
    const saleId = sale._id || "";
    const displayId = sale.id || saleId;
    
    // Obtener nombre del cliente
    let customerName = "Sin Cliente";
    if (sale.customer) {
      if (typeof sale.customer === 'object' && sale.customer.name) {
        customerName = sale.customer.name;
      } else {
        customerName = getCustomerNameById(sale.customer);
      }
    }
    
    // Mostrar productos con sus cantidades y precios
    let productDisplay = "Sin productos";
    if (sale.products && Array.isArray(sale.products) && sale.products.length > 0) {
      const productInfo = sale.products.map(item => {
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
                    <span>Precio: ${formatCurrency(item.sale_price)}</span>
                  </span>
                </div>`;
      }).join("");
      productDisplay = `<div class="product-list">${productInfo}</div>`;
    }
    
    const salesDate = sale.salesDate || new Date();
    const status = sale.status || "pending";
    const statusLabel = getStatusLabel(status);
    const statusClass = getStatusClass(status);
    
    tbody.innerHTML += `
      <tr>
        <td>${displayId}</td>
        <td>${customerName}</td>
        <td>${productDisplay}</td>
        <td>${formatDate(salesDate)}</td>
        <td>${formatCurrency(sale.total)}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <div class="action-buttons">
            <button onclick="viewSaleDetails('${saleId}')" class="icon-button view-button" title="Ver detalles">
              <i class="material-icons">visibility</i>
            </button>
            <button onclick="openStatusModal('${saleId}')" class="icon-button status-button" title="Cambiar estado" 
              ${canUpdateStatusSales ? '' : 'disabled'}>
              <i class="material-icons">sync</i>
            </button>
            <button onclick="fillEditForm('${saleId}')" class="icon-button edit-button" title="Editar" 
              ${canUpdateSales ? '' : 'disabled'}>
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteSale('${saleId}')" class="icon-button delete-button" title="Eliminar" 
              ${userPermissions.includes("delete_sales") ? '' : 'disabled'}>
              <i class="material-icons">delete</i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  renderPaginationControls();
};

// Utilidades para el estado de la venta
const getStatusLabel = (status) => {
  const statusMap = {
    "pending": "Pendiente",
    "processing": "Procesando",
    "completed": "Completada",
    "cancelled": "Cancelada"
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  const classMap = {
    "pending": "status-pending",
    "processing": "status-processing",
    "completed": "status-completed",
    "cancelled": "status-cancelled"
  };
  return classMap[status] || "status-pending";
};

// Actualizar estado de venta
const updateSaleStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  try {
    const res = await fetch(`${API_SALES}/${id}/status`, {
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
        text: data.message || `Estado de venta actualizado a ${getStatusLabel(status)}`,
        showConfirmButton: false,
        timer: 1500
      });
      
      listSales();
    } else {
      let errorMsg = data.message || `Error al actualizar el estado (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
      listSales();
    }
  } catch (err) {
    showError(`Ocurrió un error de red: ${err.message || err}`);
    listSales();
  }
};

// Modal para cambiar estado
const openStatusModal = async (id) => {
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
      showError(data.message || "Error al cargar los datos de la venta.");
      return;
    }

    const sale = await res.json();
    const currentStatus = sale.status || "pending";
    
    // Determinar estados disponibles basados en el estado actual
    let availableStatuses = [];
    
    switch (currentStatus) {
      case "pending":
        availableStatuses = ["processing", "cancelled"];
        break;
      case "processing":
        availableStatuses = ["completed", "cancelled"];
        break;
      case "completed":
        availableStatuses = ["cancelled"];
        break;
      case "cancelled":
        availableStatuses = [];
        break;
      default:
        availableStatuses = ["pending", "processing", "completed", "cancelled"];
    }
    
    // Si no hay estados disponibles para cambiar
    if (availableStatuses.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No se puede cambiar el estado",
        text: "Esta venta no puede cambiar de estado según las reglas del sistema.",
      });
      return;
    }
    
    // Crear opciones de radio para cada estado disponible
    const radioOptions = availableStatuses.map(status => {
      return `
        <div class="status-option">
          <input type="radio" id="status-${status}" name="status" value="${status}">
          <label for="status-${status}" class="status-label ${getStatusClass(status)}">
            ${getStatusLabel(status)}
          </label>
        </div>
      `;
    }).join('');
    
    Swal.fire({
      title: "Cambiar estado de la venta",
      html: `
        <div class="status-form">
          <p>ID de venta: ${sale.id || id}</p>
          <p>Estado actual: <span class="status-badge ${getStatusClass(currentStatus)}">${getStatusLabel(currentStatus)}</span></p>
          <div class="status-options">
            ${radioOptions}
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const selectedStatus = document.querySelector('input[name="status"]:checked')?.value;
        if (!selectedStatus) {
          Swal.showValidationMessage('Debe seleccionar un estado');
          return false;
        }
        return selectedStatus;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        updateSaleStatus(id, result.value);
      }
    });
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Controles de paginación
const renderPaginationControls = () => {
  if (!allSales || allSales.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allSales.length / rowsPerPage);
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
    const startItem = allSales.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allSales.length);
    info.innerHTML = `${startItem}-${endItem} de ${allSales.length}`;
  }
};

const changePage = (page) => {
  currentPage = page;
  renderSalesTable(currentPage);
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
      // Solo mostrar productos activos
      if (prod.status === "active") {
        productIdToNameMap[prod._id] = prod.name;
        
        const option = `<option value="${prod._id}" data-price="${prod.price || 0}">${prod.name}</option>`;
        if (productSelect) productSelect.innerHTML += option;
        if (editProductSelect) editProductSelect.innerHTML += option;
        if (reportProductSelect) reportProductSelect.innerHTML += option;
      }
    });
  } catch (err) {
    showError("Error al cargar productos: " + (err.message || err));
  }
};

const loadCustomers = async () => {
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
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar clientes.");
      return;
    }
    
    const data = await res.json();
    const customers = data.customers || data;
    
    const customerSelect = document.getElementById("customer");
    const editCustomerSelect = document.getElementById("editCustomer");
    const reportCustomerSelect = document.getElementById("reportCustomer");
    
    if (!customerSelect && !editCustomerSelect && !reportCustomerSelect) {
      return;
    }
    
    if (customerSelect) {
      customerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar cliente</option>`;
    }
    
    if (editCustomerSelect) {
      editCustomerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar cliente</option>`;
    }
    
    if (reportCustomerSelect) {
      reportCustomerSelect.innerHTML = `<option value="">Todos los clientes</option>`;
    }
    
    customerIdToNameMap = {};
    customers.forEach(cust => {
      customerIdToNameMap[cust._id] = cust.name;
      
      const option = `<option value="${cust._id}">${cust.name}</option>`;
      if (customerSelect) customerSelect.innerHTML += option;
      if (editCustomerSelect) editCustomerSelect.innerHTML += option;
      if (reportCustomerSelect) reportCustomerSelect.innerHTML += option;
    });
  } catch (err) {
    showError("Error al cargar clientes: " + (err.message || err));
  }
};

// Gestión de productos en formulario
const addProductItem = () => {
  const productSelect = document.getElementById("product");
  const quantityInput = document.getElementById("quantity");
  
  if (!productSelect || !quantityInput) {
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
  
  // Obtener precio desde el atributo data-price del select
  const selectedOption = productSelect.options[productSelect.selectedIndex];
  const price = parseFloat(selectedOption.getAttribute("data-price") || 0);
  
  if (price <= 0) {
    showValidation("El producto seleccionado no tiene un precio válido");
    return;
  }
  
  const total = quantity * price;
  const productName = selectedOption.text;
  
  productItems.push({
    product: productId,
    quantity: quantity,
    sale_price: price,
    total: total,
    name: productName
  });
  
  updateProductItemsList();
  
  productSelect.value = "";
  quantityInput.value = "1";
  
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
            <span>Precio: ${formatCurrency(item.sale_price)}</span>
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

// Ver detalles de venta
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
    
    // Obtener nombre del cliente
    let customerName = "Sin Cliente";
    let customerEmail = "N/A";
    let customerPhone = "N/A";
    
    if (sale.customer) {
      if (typeof sale.customer === 'object') {
        customerName = sale.customer.name || "Sin nombre";
        customerEmail = sale.customer.email || "Sin email";
        customerPhone = sale.customer.phone || "Sin teléfono";
      } else {
        customerName = getCustomerNameById(sale.customer);
      }
    }
    
    // Crear contenido HTML para el modal de detalles
    let productsHtml = '<p>No hay productos en esta venta</p>';
    
    if (sale.products && sale.products.length > 0) {
      productsHtml = '<table class="details-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Venta</th><th>Subtotal</th></tr></thead><tbody>';
      
      sale.products.forEach(item => {
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
        
        const price = item.sale_price || 0;
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
    }
    
    // Estado de la venta
    const status = sale.status || "pending";
    const statusHtml = `
      <p><strong>Estado:</strong> <span class="status-badge ${getStatusClass(status)}">${getStatusLabel(status)}</span></p>
    `;
    
    // Mostrar modal con Sweet Alert
    Swal.fire({
      title: `Detalles de venta: ${sale.id || ""}`,
      html: `
        <div class="sale-details">
          <div class="details-section">
            <h4>Información General</h4>
            <p><strong>Cliente:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Teléfono:</strong> ${customerPhone}</p>
            <p><strong>Fecha:</strong> ${formatDate(sale.salesDate)}</p>
            <p><strong>Total:</strong> ${formatCurrency(sale.total)}</p>
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
        container: 'sale-details-modal'
      }
    });
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Registrar venta
const registerSale = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  if (productItems.length === 0) {
    showValidation("Debe agregar al menos un producto a la venta.");
    return;
  }
  
  const customerSelect = document.getElementById("customer");
  const salesDateInput = document.getElementById("salesDate");
  
  if (!customerSelect || !salesDateInput) {
    showError("No se encontraron los campos del formulario");
    return;
  }
  
  const customerId = customerSelect.value;
  if (!customerId) {
    showValidation("Debe seleccionar un cliente");
    return;
  }
  
  const salesDate = salesDateInput.value;
  if (!salesDate) {
    showValidation("La fecha de venta es obligatoria");
    return;
  }
  
  const total = productItems.reduce((sum, item) => sum + item.total, 0);

  try {
    const res = await fetch(API_SALES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        customer: customerId,
        products: productItems,
        salesDate: salesDate,
        total: total
        // El estado se define en el modelo con default
      })
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al registrar venta.");
      return;
    }
    
    const data = await res.json();
    showSuccess(data.message || "Venta registrada correctamente.");
    closeModal('registerModal');
    
    const saleForm = document.getElementById("saleForm");
    if (saleForm) {
      saleForm.reset();
    }
    
    productItems = [];
    updateProductItemsList();
    listSales();
  } catch (err) {
    showError("Error al registrar venta: " + (err.message || err));
  }
};

// Editar venta
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const confirmed = await showConfirm({
    title: "¿Deseas editar esta venta?",
    text: "Solo podrás modificar el cliente y la fecha. Para modificar productos o estado, utiliza las opciones específicas.",
    confirmText: "Editar",
    cancelText: "Cancelar",
  });

  if (!confirmed) {
    Swal.fire({
      icon: "info",
      title: "Operación cancelada",
      text: "No se editará esta venta",
    });
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
      showError(data.message || "Error al cargar los datos de la venta.");
      return;
    }

    const sale = await res.json();
    
    // Verificar elementos del formulario
    const editIdElement = document.getElementById("editId");
    const editCustomerElement = document.getElementById("editCustomer");
    const editSalesDateElement = document.getElementById("editSalesDate");
    
    if (!editIdElement || !editCustomerElement || !editSalesDateElement) {
      showError("No se encontraron todos los campos del formulario de edición");
      return;
    }
    
    // Obtener valores de campos
    const saleId = sale._id;
    const customerId = sale.customer?._id || sale.customer;
    const salesDate = sale.salesDate?.split('T')[0] || "";
    
    editIdElement.value = saleId;
    editCustomerElement.value = customerId;
    editSalesDateElement.value = salesDate;
    
    // Advertir sobre limitaciones de edición
    Swal.fire({
      icon: "info",
      title: "Edición limitada",
      text: "Por motivos de integridad del sistema, solo puedes editar el cliente y la fecha de la venta. Para modificar productos o el estado, deberás usar las opciones específicas.",
    });

    openModal("editModal");
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar venta
const updateSale = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const editIdElement = document.getElementById("editId");
  const editCustomerElement = document.getElementById("editCustomer");
  const editSalesDateElement = document.getElementById("editSalesDate");
  
  if (!editIdElement || !editCustomerElement || !editSalesDateElement) {
    showError("No se encontraron todos los campos del formulario de edición");
    return;
  }

  const saleId = editIdElement.value;
  const customer = editCustomerElement.value;
  const salesDate = editSalesDateElement.value;

  if (!customer || !salesDate) {
    showError("Todos los campos son obligatorios.");
    return;
  }

  try {
    const res = await fetch(`${API_SALES}/${saleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        customer, 
        salesDate
      }),
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al actualizar la venta.");
      return;
    }

    const data = await res.json();
    showSuccess(data.message || "Venta actualizada correctamente.");
    closeModal("editModal");
    
    const editForm = document.getElementById("editForm");
    if (editForm) {
      editForm.reset();
    }
    
    listSales();
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Listar ventas
const listSales = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
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
      showError(data.message || "Error al listar ventas.");
      return;
    }
    
    const data = await res.json();
    
    originalSales = Array.isArray(data) ? data : [];
    allSales = [...originalSales];
    currentPage = 1;
    renderSalesTable(currentPage);
  } catch (err) {
    showError("Error al listar ventas: " + (err.message || err));
  }
};

// Eliminar venta
const deleteSale = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  // Primero verificar si la venta está en estado que permite eliminar
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
      showError(data.message || "Error al verificar estado de la venta.");
      return;
    }
    
    const sale = await res.json();
    const status = sale.status || "pending";
    
    if (!["pending", "cancelled"].includes(status)) {
      Swal.fire({
        icon: "error",
        title: "No se puede eliminar",
        text: "Solo se pueden eliminar ventas en estado pendiente o canceladas.",
      });
      return;
    }
    
    const confirmed = await showConfirm({
      title: "¿Estás seguro de eliminar esta venta?",
      text: "Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar"
    });
    
    if (!confirmed) return;
  
    const deleteRes = await fetch(`${API_SALES}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!deleteRes.ok) {
      const data = await deleteRes.json();
      showError(data.message || "No se pudo eliminar la venta");
      return;
    }
    
    showSuccess("Venta eliminada correctamente.");
    listSales();
  } catch (err) {
    showError("Error al eliminar venta: " + (err.message || err));
  }
};

// Buscar venta
const searchSale = () => {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalSales) return;
  
  if (!term) {
    allSales = [...originalSales];
  } else {
    allSales = originalSales.filter(s => {
      // Buscar en cliente
      const customerMatch = 
        (s.customer?.name && s.customer.name.toLowerCase().includes(term)) ||
        (s.customer?.email && s.customer.email.toLowerCase().includes(term)) ||
        (s.customer?.phone && s.customer.phone.toLowerCase().includes(term));
      
      // Buscar en productos
      const productsMatch = 
        (s.products && Array.isArray(s.products) && s.products.some(item => {
          if (item.product?.name) {
            return item.product.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.product]) {
            return productIdToNameMap[item.product].toLowerCase().includes(term);
          }
          return false;
        }));
      
      // Buscar en ID o estado
      return (
        customerMatch || 
        productsMatch ||
        (s.id && s.id.toLowerCase().includes(term)) ||
        (s.status && s.status.toLowerCase().includes(term))
      );
    });
  }
  
  currentPage = 1;
  renderSalesTable(currentPage);
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
  
  openModal("reportModal");
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
    title: 'Generando informe...',
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
    const reportCustomerElement = document.getElementById("reportCustomer");
    const reportStatusElement = document.getElementById("reportStatus");
    
    if (!reportStartDateElement || !reportEndDateElement) {
      throw new Error("No se encontraron elementos del formulario de reporte");
    }
    
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const productId = reportProductElement?.value || '';
    const customerId = reportCustomerElement?.value || '';
    const status = reportStatusElement?.value || '';
    
    // Validar fechas (exactamente como el backend)
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
    }
    
    // Construir URL con parámetros (exactamente como el backend)
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    
    // Solo agregar si son ObjectIds válidos (como en el backend)
    if (productId && isValidObjectId(productId)) {
      params.append("productId", productId);
    }
    
    if (customerId && isValidObjectId(customerId)) {
      params.append("customerId", customerId);
    }
    
    if (status && ['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      params.append("status", status);
    }
    
    const url = `${API_SALES}/export/pdf?${params.toString()}`;
    
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
      throw new Error("El archivo generado está vacío. Verifique los filtros seleccionados.");
    }
    
    // Crear URL del objeto y forzar la descarga
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `sales-report-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    Swal.close();
    showSuccess("Informe PDF generado correctamente. El archivo contiene detalles de cada venta.");
  } catch (error) {
    Swal.close();
    showError(`Error al generar informe: ${error.message}`);
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
    title: 'Generando informe...',
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
    const reportCustomerElement = document.getElementById("reportCustomer");
    const reportStatusElement = document.getElementById("reportStatus");
    
    if (!reportStartDateElement || !reportEndDateElement) {
      throw new Error("No se encontraron elementos del formulario de reporte");
    }
    
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const productId = reportProductElement?.value || '';
    const customerId = reportCustomerElement?.value || '';
    const status = reportStatusElement?.value || '';
    
    // Validar fechas (exactamente como el backend)
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
    }
    
    // Construir URL con parámetros (exactamente como el backend)
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    
    // Solo agregar si son ObjectIds válidos (como en el backend)
    if (productId && isValidObjectId(productId)) {
      params.append("productId", productId);
    }
    
    if (customerId && isValidObjectId(customerId)) {
      params.append("customerId", customerId);
    }
    
    if (status && ['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      params.append("status", status);
    }
    
    const url = `${API_SALES}/export/excel?${params.toString()}`;
    
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
      throw new Error("El archivo generado está vacío. Verifique los filtros seleccionados.");
    }
    
    // Crear URL del objeto y forzar la descarga
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `sales-report-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    Swal.close();
    showSuccess("Informe Excel generado correctamente. El archivo incluye hojas detalladas por producto.");
  } catch (error) {
    Swal.close();
    showError(`Error al generar informe: ${error.message}`);
  }
  
  closeModal("reportModal");
};

// Validar formato de ID de MongoDB
const isValidObjectId = (id) => {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};

// Utilidades para mensajes
const showError = (message) => {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonColor: '#3085d6'
  });
};

const showSuccess = (message) => {
  Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: message,
    confirmButtonColor: '#3085d6',
    timer: 2000,
    showConfirmButton: false
  });
};

const showValidation = (message) => {
  Swal.fire({
    icon: 'warning',
    title: 'Validación',
    text: message,
    confirmButtonColor: '#3085d6'
  });
};

const showConfirm = (options) => {
  return Swal.fire({
    icon: 'question',
    title: options.title || 'Confirmar acción',
    text: options.text || '¿Está seguro de realizar esta acción?',
    showCancelButton: true,
    confirmButtonText: options.confirmText || 'Confirmar',
    cancelButtonText: options.cancelText || 'Cancelar',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33'
  }).then(result => {
    return result.isConfirmed;
  });
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
  listSales();
  loadProducts();
  loadCustomers();
  
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
    registerButton.onclick = registerSale;
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchSale);
  }

  // Validar entradas numéricas
  const quantityInput = document.getElementById("quantity");
  if (quantityInput) {
    quantityInput.onkeypress = (evt) => isNumber(evt);
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
      await updateSale();
    };
  }
  
  // Configurar formulario de registro
  const saleForm = document.getElementById("saleForm");
  if (saleForm) {
    saleForm.onsubmit = async (event) => {
      event.preventDefault();
      await registerSale();
    };
  }
  
  // Configurar select de productos para actualizar precio cuando se seleccione un producto
  const productSelect = document.getElementById("product");
  if (productSelect) {
    productSelect.addEventListener("change", function() {
      const selectedOption = this.options[this.selectedIndex];
      const price = selectedOption.getAttribute("data-price") || 0;
      
      const priceDisplay = document.getElementById("productPrice");
      if (priceDisplay) {
        priceDisplay.textContent = formatCurrency(price);
      }
    });
  }
});

// Funciones globales
window.fillEditForm = fillEditForm;
window.deleteSale = deleteSale;
window.updateSale = updateSale;
window.updateSaleStatus = updateSaleStatus;
window.openModal = openModal;
window.closeModal = closeModal;
window.searchSale = searchSale;
window.openReportModal = openReportModal;
window.generatePdfReport = generatePdfReport;
window.generateExcelReport = generateExcelReport;
window.addProductItem = addProductItem;
window.removeProductItem = removeProductItem;
window.viewSaleDetails = viewSaleDetails;
window.openStatusModal = openStatusModal;
window.isNumber = isNumber;