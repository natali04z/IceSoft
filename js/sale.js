// ===== API ENDPOINTS =====
const API = {
    SALES: "https://backend-yy4o.onrender.com/api/sales",
    PRODUCTS: "https://backend-yy4o.onrender.com/api/products",
    CUSTOMERS: "https://backend-yy4o.onrender.com/api/customers"
};

// ===== STATE MANAGEMENT =====
const state = {
    sales: {
        all: [],
        original: [],
        currentPage: 1,
        rowsPerPage: 10
    },
    productItems: [],
    selectedSaleId: null
};

// ===== UTILITY FUNCTIONS =====

/**
 * Format date to localized string
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    } catch (e) {
        console.error("Error al formatear fecha:", e);
        return dateString;
    }
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "No disponible";
    try {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(amount);
    } catch (e) {
        console.error("Error al formatear moneda:", e);
        return amount.toString();
    }
};

/**
 * Check if string is a valid MongoDB ObjectId
 * @param {string} id - ID to check
 * @returns {boolean} Whether ID is valid
 */
const isValidObjectId = (id) => {
    return id && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Get auth token from local storage
 * @returns {string|null} Auth token or null if not found
 */
const getAuthToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
        showError("Token no encontrado. Inicie sesión nuevamente.");
        return null;
    }
    return token;
};

// ===== UI NOTIFICATIONS =====

/**
 * Show success notification
 * @param {string} message - Success message to display
 */
const showSuccess = (message) => {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: message,
        timer: 3000
    });
};

/**
 * Show error notification
 * @param {string} message - Error message to display
 */
const showError = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
    });
};

/**
 * Show validation error notification
 * @param {string} message - Validation message to display
 */
const showValidation = (message) => {
    Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: message
    });
};

/**
 * Show confirmation dialog
 * @param {Object} options - Dialog options
 * @returns {Promise<boolean>} Whether user confirmed
 */
const showConfirm = async (options) => {
    const { title, text, confirmText, cancelText } = options;
    
    const result = await Swal.fire({
        icon: 'question',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText || 'Confirmar',
        cancelButtonText: cancelText || 'Cancelar'
    });
    
    return result.isConfirmed;
};

// ===== MODAL MANAGEMENT =====

/**
 * Open a modal dialog
 * @param {string} modalId - ID of modal to open
 */
const openModal = (modalId) => {
    document.getElementById(modalId).style.display = "flex";
    
    // If it's the register modal, reset product items
    if (modalId === "registerModal") {
        state.productItems = [];
        updateProductItemsList();
        updateTotalAmount();
    }
};

/**
 * Close a modal dialog
 * @param {string} modalId - ID of modal to close
 */
const closeModal = (modalId) => {
    document.getElementById(modalId).style.display = "none";
};

// Close modal if user clicks outside the content
window.onclick = function(event) {
    const modals = {
        "registerModal": document.getElementById("registerModal"),
        "reportModal": document.getElementById("reportModal"),
        "editModal": document.getElementById("editModal")
    };
    
    Object.entries(modals).forEach(([id, element]) => {
        if (event.target === element) {
            element.style.display = "none";
        }
    });
};

// ===== DATA FETCHING FUNCTIONS =====

/**
 * Load products for selects
 */
const loadProducts = async () => {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        console.log("Iniciando carga de productos desde:", API.PRODUCTS);
        
        const res = await fetch(API.PRODUCTS, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            console.error("Error al cargar productos:", res.status, res.statusText);
            showError(`Error al cargar productos: ${res.status} ${res.statusText}`);
            return;
        }
        
        let data;
        try {
            data = await res.json();
            console.log("Respuesta de productos recibida:", data);
        } catch (err) {
            console.error("Error al parsear respuesta JSON de productos:", err);
            showError("Error al procesar datos de productos");
            return;
        }
        
        // Determinar la estructura de los datos recibidos
        let products = [];
        if (Array.isArray(data)) {
            console.log("Datos de productos recibidos como array");
            products = data;
        } else if (data && data.products && Array.isArray(data.products)) {
            console.log("Datos de productos recibidos en propiedad 'products'");
            products = data.products;
        } else if (data && typeof data === 'object') {
            console.log("Datos de productos recibidos en formato desconocido, intentando procesarlos");
            try {
                // Último intento: convertir el objeto en array
                products = Object.values(data).filter(item => item && typeof item === 'object');
            } catch (e) {
                console.error("No se pudo procesar la estructura de productos:", e);
            }
        }
        
        console.log(`Productos procesados: ${products.length}`);
        
        if (products.length === 0) {
            console.warn("No se encontraron productos para mostrar");
        }
        
        // Verificar que los elementos existen
        const productSelect = document.getElementById("product");
        const reportProductSelect = document.getElementById("reportProduct");
        
        console.log("Estado del selector de productos:", 
                   productSelect ? "Encontrado" : "NO ENCONTRADO");
        console.log("Estado del selector de productos para reportes:", 
                   reportProductSelect ? "Encontrado" : "NO ENCONTRADO");
        
        // Poblar el selector de productos para nuevas ventas (solo productos activos)
        if (productSelect) {
            productSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar producto</option>`;
            
            products.forEach(prod => {
                // Solo incluir productos activos
                if (prod.status !== "active") return;
                
                // Verificar si el producto tiene un ID válido
                const productId = prod._id || prod.id;
                if (!productId) {
                    console.warn("Producto sin ID detectado:", prod);
                    return;
                }
                
                const productName = prod.name || "Producto sin nombre";
                const stockInfo = prod.stock !== undefined ? ` (Stock: ${prod.stock})` : '';
                productSelect.innerHTML += `<option value="${productId}" data-price="${prod.price || 0}">${productName}${stockInfo}</option>`;
            });
            
            console.log(`Opciones de productos añadidas: ${productSelect.options.length - 1}`);

            // Añadir evento para autocompletar el precio cuando se selecciona un producto
            productSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const priceInput = document.getElementById("price");
                if (priceInput && selectedOption.dataset.price) {
                    priceInput.value = selectedOption.dataset.price;
                }
            });
        }
        
        // Para el selector de reportes, añadir opción "Todos"
        if (reportProductSelect) {
            reportProductSelect.innerHTML = `<option value="">Todos los productos</option>`;
            
            products.forEach(prod => {
                const productId = prod._id || prod.id;
                if (!productId) return;
                
                const productName = prod.name || "Producto sin nombre";
                reportProductSelect.innerHTML += `<option value="${productId}">${productName}</option>`;
            });
            
            console.log(`Opciones de productos para reportes añadidas: ${reportProductSelect.options.length - 1}`);
        }
    } catch (err) {
        console.error("Error general al cargar productos:", err);
        showError("Error al cargar productos: " + (err.message || "Error desconocido"));
    }
};

/**
 * Load customers for selects
 */
const loadCustomers = async () => {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        console.log("Iniciando carga de clientes desde:", API.CUSTOMERS);
        
        const res = await fetch(API.CUSTOMERS, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            console.error("Error al cargar clientes:", res.status, res.statusText);
            showError(`Error al cargar clientes: ${res.status} ${res.statusText}`);
            return;
        }
        
        let data;
        try {
            data = await res.json();
            console.log("Respuesta de clientes recibida:", data);
        } catch (err) {
            console.error("Error al parsear respuesta JSON de clientes:", err);
            showError("Error al procesar datos de clientes");
            return;
        }
        
        // Determinar la estructura de los datos recibidos
        let customers = [];
        if (Array.isArray(data)) {
            console.log("Datos de clientes recibidos como array");
            customers = data;
        } else if (data && data.customers && Array.isArray(data.customers)) {
            console.log("Datos de clientes recibidos en propiedad 'customers'");
            customers = data.customers;
        } else if (data && typeof data === 'object') {
            console.log("Datos de clientes recibidos en formato desconocido, intentando procesarlos");
            try {
                // Último intento: convertir el objeto en array
                customers = Object.values(data).filter(item => item && typeof item === 'object');
            } catch (e) {
                console.error("No se pudo procesar la estructura de clientes:", e);
            }
        }
        
        console.log(`Clientes procesados: ${customers.length}`);
        
        if (customers.length === 0) {
            console.warn("No se encontraron clientes para mostrar");
        }
        
        // Verificar que los elementos existen
        const customerSelect = document.getElementById("customer");
        const reportCustomerSelect = document.getElementById("reportCustomer");
        
        console.log("Estado del selector de clientes:", 
                   customerSelect ? "Encontrado" : "NO ENCONTRADO");
        console.log("Estado del selector de clientes para reportes:", 
                   reportCustomerSelect ? "Encontrado" : "NO ENCONTRADO");
        
        // Poblar el selector de clientes para nuevas ventas
        if (customerSelect) {
            customerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar cliente</option>`;
            
            customers.forEach(cust => {
                // Verificar si el cliente tiene un ID válido
                const customerId = cust._id || cust.id;
                if (!customerId) {
                    console.warn("Cliente sin ID detectado:", cust);
                    return;
                }
                
                const customerName = cust.name || "Cliente sin nombre";
                customerSelect.innerHTML += `<option value="${customerId}">${customerName}</option>`;
            });
            
            console.log(`Opciones de clientes añadidas: ${customerSelect.options.length - 1}`);
        }
        
        // Para el selector de reportes, añadir opción "Todos"
        if (reportCustomerSelect) {
            reportCustomerSelect.innerHTML = `<option value="">Todos los clientes</option>`;
            
            customers.forEach(cust => {
                const customerId = cust._id || cust.id;
                if (!customerId) return;
                
                const customerName = cust.name || "Cliente sin nombre";
                reportCustomerSelect.innerHTML += `<option value="${customerId}">${customerName}</option>`;
            });
            
            console.log(`Opciones de clientes para reportes añadidas: ${reportCustomerSelect.options.length - 1}`);
        }
    } catch (err) {
        console.error("Error general al cargar clientes:", err);
        showError("Error al cargar clientes: " + (err.message || "Error desconocido"));
    }
};

/**
 * Load customers for edit form
 */
const loadCustomersForEdit = async () => {
    const editCustomerSelect = document.getElementById("editCustomer");
    
    if (!editCustomerSelect) {
        console.error("No se encontró el elemento select con ID 'editCustomer'");
        return;
    }
    
    // If customers already loaded, don't reload
    if (editCustomerSelect.options.length > 1) {
        return;
    }
    
    try {
        const token = getAuthToken();
        if (!token) return;
        
        const res = await fetch(API.CUSTOMERS, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });
        
        let data;
        try {
            data = await res.json();
        } catch (err) {
            console.error("Error al leer la respuesta JSON:", err);
            if (!res.ok) {
                showError("Error al cargar clientes para edición.");
                return;
            }
        }
        
        if (!res.ok) {
            showError(data?.message || "Error al cargar clientes para edición.");
            return;
        }
        
        const customers = data.customers || data;
        
        // Reset options
        editCustomerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar cliente</option>`;
        
        customers.forEach(cust => {
            const customerId = cust._id || cust.id;
            if (!customerId) return;
            
            const option = `<option value="${customerId}">${cust.name}</option>`;
            editCustomerSelect.innerHTML += option;
        });
    } catch (err) {
        console.error("Error al cargar clientes para edición:", err);
        showError("Error al cargar clientes para edición: " + (err.message || "Error desconocido"));
    }
};

// ===== PRODUCT ITEM MANAGEMENT =====

/**
 * Add a product item to the current sale
 */
const addProductItem = () => {
    const productSelect = document.getElementById("product");
    const quantityInput = document.getElementById("quantity");
    const priceInput = document.getElementById("price");
    
    if (!productSelect || !quantityInput || !priceInput) {
        console.error("No se encontraron los elementos necesarios para añadir un producto");
        return;
    }
    
    const productId = productSelect.value;
    const quantity = parseInt(quantityInput.value);
    const price = parseFloat(priceInput.value);
    
    if (!productId || isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
        showValidation("Seleccione un producto y especifique cantidad y precio válidos.");
        return;
    }
    
    // Get product name for display
    const productName = productSelect.options[productSelect.selectedIndex].text;
    
    // Add to product items list
    state.productItems.push({
        product: productId,
        quantity: quantity,
        name: productName,
        total: price * quantity
    });
    
    // Update UI
    updateProductItemsList();
    updateTotalAmount();
    
    // Reset fields
    productSelect.value = "";
    quantityInput.value = "1";
    priceInput.value = "";
};

/**
 * Remove a product item from the current sale
 * @param {number} index - Index of product to remove
 */
const removeProductItem = (index) => {
    state.productItems.splice(index, 1);
    updateProductItemsList();
    updateTotalAmount();
};

/**
 * Update the product items list in the UI
 */
const updateProductItemsList = () => {
    const container = document.getElementById("productItemsList");
    if (!container) {
        console.error("No se encontró el elemento con ID 'productItemsList'");
        return;
    }
    
    if (state.productItems.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay productos agregados</p>';
        return;
    }
    
    let html = '<div class="product-items">';
    state.productItems.forEach((item, index) => {
        html += `
            <div class="product-item">
                <div class="product-info">
                    <span class="product-name">${item.name}</span>
                    <span class="product-details">
                        Cantidad: ${item.quantity} | 
                        Subtotal: ${formatCurrency(item.total)}
                    </span>
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

/**
 * Update the total amount display
 */
const updateTotalAmount = () => {
    const totalContainer = document.getElementById("totalAmount");
    if (!totalContainer) {
        console.error("No se encontró el elemento con ID 'totalAmount'");
        return;
    }
    
    const total = state.productItems.reduce((sum, item) => sum + item.total, 0);
    totalContainer.textContent = formatCurrency(total);
};

/**
 * Display products in the edit form
 * @param {Array} products - Products to display
 */
const displayEditProducts = (products) => {
    const container = document.getElementById("editProductItemsList");
    if (!container) {
        console.error("No se encontró el elemento con ID 'editProductItemsList'");
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay productos en esta venta</p>';
        return;
    }
    
    let html = '<div class="product-items">';
    products.forEach(item => {
        const productName = item.product?.name || "Producto desconocido";
        html += `
            <div class="product-item">
                <div class="product-info">
                    <span class="product-name">${productName}</span>
                    <span class="product-details">
                        Cantidad: ${item.quantity} | 
                        Precio: ${formatCurrency(item.sale_price || 0)} | 
                        Subtotal: ${formatCurrency(item.total || 0)}
                    </span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
};

// ===== TABLE RENDERING AND PAGINATION =====

/**
 * Render the sales table
 * @param {number} page - Page number to render
 */
const renderSalesTable = (page = 1) => {
    const tbody = document.getElementById("salesTableBody");
    
    if (!tbody) {
        console.error("No se encontró el elemento tbody con ID 'salesTableBody'");
        return;
    }
    
    tbody.innerHTML = "";

    const start = (page - 1) * state.sales.rowsPerPage;
    const end = start + state.sales.rowsPerPage;
    const salesToShow = state.sales.all.slice(start, end);

    if (salesToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay ventas para mostrar</td></tr>`;
        renderPaginationControls();
        return;
    }

    salesToShow.forEach(sale => {
        const saleId = sale._id || "";
        const displayId = sale.id || saleId;
        
        // Display first product or "Multiple" if multiple products
        let productDisplay = "Sin Producto";
        if (sale.products && sale.products.length > 0) {
            productDisplay = sale.products.length > 1 
                ? "Múltiples productos" 
                : (sale.products[0].product?.name || "Producto desconocido");
        }
        
        // Display customer
        const customerName = sale.customer?.name || "Cliente no especificado";
        
        // Get status display and color class
        const statusMap = {
            "pending": { text: "Pendiente", class: "status-pending" },
            "processing": { text: "En Proceso", class: "status-processing" },
            "completed": { text: "Completado", class: "status-completed" },
            "cancelled": { text: "Cancelado", class: "status-cancelled" }
        };
        
        const status = statusMap[sale.status] || { text: sale.status || "Desconocido", class: "" };
        
        tbody.innerHTML += `
            <tr>
                <td>${displayId}</td>
                <td>${customerName}</td>
                <td>${productDisplay}</td>
                <td>${formatCurrency(sale.total)}</td>
                <td>${formatDate(sale.salesDate)}</td>
                <td><span class="status-badge ${status.class}">${status.text}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewSaleDetails('${saleId}')" class="icon-button view-button" title="Ver detalles">
                            <i class="material-icons">visibility</i>
                        </button>
                        <button onclick="fillEditForm('${saleId}')" class="icon-button edit-button" title="Editar">
                            <i class="material-icons">edit</i>
                        </button>
                        <button onclick="updateSaleStatus('${saleId}')" class="icon-button status-button" title="Cambiar estado">
                            <i class="material-icons">update</i>
                        </button>
                        <button onclick="deleteSale('${saleId}')" class="icon-button delete-button" title="Eliminar">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    renderPaginationControls();
};

/**
 * Render pagination controls
 */
const renderPaginationControls = () => {
    const totalPages = Math.ceil(state.sales.all.length / state.sales.rowsPerPage);
    const container = document.querySelector(".page-numbers");
    const info = document.querySelector(".pagination .page-info");
    
    if (!container) {
        console.error("No se encontró el elemento con clase 'page-numbers'");
        return;
    }

    container.innerHTML = "";

    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.classList.add("page-nav");
    prevBtn.innerText = "←";
    prevBtn.disabled = state.sales.currentPage === 1;
    prevBtn.onclick = () => changePage(state.sales.currentPage - 1);
    container.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("div");
        btn.classList.add("page-number");
        if (i === state.sales.currentPage) btn.classList.add("active");
        btn.innerText = i;
        btn.onclick = () => changePage(i);
        container.appendChild(btn);
    }

    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.classList.add("page-nav");
    nextBtn.innerText = "→";
    nextBtn.disabled = state.sales.currentPage === totalPages || totalPages === 0;
    nextBtn.onclick = () => changePage(state.sales.currentPage + 1);
    container.appendChild(nextBtn);

    if (info) {
        const startItem = state.sales.all.length > 0 ? (state.sales.currentPage - 1) * state.sales.rowsPerPage + 1 : 0;
        const endItem = Math.min(startItem + state.sales.rowsPerPage - 1, state.sales.all.length);
        info.innerHTML = `${startItem}-${endItem} de ${state.sales.all.length}`;
    }
};

/**
 * Change the current page
 * @param {number} page - Page number to change to
 */
const changePage = (page) => {
    state.sales.currentPage = page;
    renderSalesTable(state.sales.currentPage);
};

// ===== SALES CRUD OPERATIONS =====

/**
 * List all sales
 */
const listSales = async () => {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        console.log("Iniciando listado de ventas desde:", API.SALES);
        
        const res = await fetch(API.SALES, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            console.error("Error al listar ventas:", res.status, res.statusText);
            showError(`Error al listar ventas: ${res.status} ${res.statusText}`);
            return;
        }
        
        let data;
        try {
            data = await res.json();
            console.log("Respuesta de ventas recibida:", data);
        } catch (err) {
            console.error("Error al parsear respuesta JSON de ventas:", err);
            showError("Error al procesar datos de ventas");
            return;
        }
        
        // Determinar la estructura de los datos recibidos
        let sales = [];
        if (Array.isArray(data)) {
            console.log("Datos de ventas recibidos como array");
            sales = data;
        } else if (data && data.sales && Array.isArray(data.sales)) {
            console.log("Datos de ventas recibidos en propiedad 'sales'");
            sales = data.sales;
        } else if (data && typeof data === 'object') {
            console.log("Datos de ventas recibidos en formato desconocido, intentando procesarlos");
            try {
                sales = Object.values(data).filter(item => item && typeof item === 'object');
            } catch (e) {
                console.error("No se pudo procesar la estructura de ventas:", e);
            }
        }
        
        console.log(`Ventas procesadas: ${sales.length}`);
        
        if (sales.length === 0) {
            console.warn("No se encontraron ventas para mostrar");
        }
        
        // Set sales data
        state.sales.original = sales;
        state.sales.all = [...state.sales.original];
        state.sales.currentPage = 1;
        renderSalesTable(state.sales.currentPage);
    } catch (err) {
        console.error("Error general al listar ventas:", err);
        showError("Error al listar ventas: " + (err.message || "Error desconocido"));
    }
};

/**
 * View sale details
 * @param {string} id - ID of sale to view
 */
const viewSaleDetails = async (id) => {
    try {
        const token = getAuthToken();
        if (!token) return;

        const res = await fetch(`${API.SALES}/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        let sale;
        try {
            sale = await res.json();
        } catch (err) {
            console.error("Error al leer la respuesta JSON:", err);
            if (!res.ok) {
                showError("Error al cargar los detalles de la venta.");
                return;
            }
        }

        if (!res.ok) {
            showError(sale?.message || "Error al cargar los detalles de la venta.");
            return;
        }

        // Create HTML content for details modal
        let productsHtml = '<p>No hay productos en esta venta</p>';
        
        if (sale.products && sale.products.length > 0) {
            productsHtml = '<table class="details-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>';
            
            sale.products.forEach(item => {
                const productName = item.product?.name || "Producto desconocido";
                productsHtml += `
                    <tr>
                        <td>${productName}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.sale_price || 0)}</td>
                        <td>${formatCurrency(item.total || 0)}</td>
                    </tr>
                `;
            });
            
            productsHtml += '</tbody></table>';
        }
        
        // Status text with colors
        const statusMap = {
            "pending": { text: "Pendiente", class: "status-pending" },
            "processing": { text: "En Proceso", class: "status-processing" },
            "completed": { text: "Completado", class: "status-completed" },
            "cancelled": { text: "Cancelado", class: "status-cancelled" }
        };
        
        const status = statusMap[sale.status] || { text: sale.status || "Desconocido", class: "" };
        
        // Show modal with SweetAlert
        Swal.fire({
            title: `Detalles de venta: ${sale.id || ""}`,
            html: `
                <div class="sale-details">
                    <div class="details-section">
                        <h4>Información General</h4>
                        <p><strong>Cliente:</strong> ${sale.customer ? sale.customer.name : 'No especificado'}</p>
                        <p><strong>Fecha:</strong> ${formatDate(sale.salesDate)}</p>
                        <p><strong>Estado:</strong> <span class="status-badge ${status.class}">${status.text}</span></p>
                        <p><strong>Total:</strong> ${formatCurrency(sale.total)}</p>
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
        console.error("Error al cargar los detalles de la venta:", err);
        showError(`Ocurrió un error: ${err.message || "Error desconocido"}`);
    }
};

/**
 * Register a new sale
 */
const registerSale = async () => {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        // Validations
        const customerSelect = document.getElementById("customer");
        const salesDateInput = document.getElementById("salesDate");
        
        if (!customerSelect || !salesDateInput) {
            showError("No se encontraron elementos del formulario.");
            return;
        }
        
        let customerId = customerSelect.value;
        const salesDate = salesDateInput.value;
        
        if (!customerId) {
            showValidation("Debe seleccionar un cliente.");
            return;
        }

        if (state.productItems.length === 0) {
            showValidation("Debe agregar al menos un producto a la venta.");
            return;
        }
        
        if (!salesDate) {
            showValidation("La fecha de venta es obligatoria.");
            return;
        }

        const confirmed = await showConfirm({
            title: "¿Confirmas registrar esta venta?",
            text: "Se creará una nueva venta con los datos proporcionados.",
            confirmText: "Registrar",
            cancelText: "Cancelar"
        });

        if (!confirmed) {
            Swal.fire({
                icon: 'info',
                title: 'Operación cancelada',
                text: 'No se ha registrado ninguna venta',
            });
            closeModal('registerModal');
            return;
        }

        // Preparar productos para el API - solo se necesita product y quantity
        const cleanedProducts = state.productItems.map(item => {
            return {
                product: item.product,
                quantity: item.quantity
            };
        });

        const res = await fetch(API.SALES, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                customer: customerId,
                products: cleanedProducts,
                salesDate
            })
        });
        
        let data;
        try {
            data = await res.json();
        } catch (err) {
            console.error("Error al leer la respuesta JSON:", err);
            if (!res.ok) {
                showError("Error al registrar venta.");
                return;
            }
        }
        
        if (!res.ok) {
            if (data && data.errors && Array.isArray(data.errors)) {
                showError(`Error de validación: ${data.errors.join(', ')}`);
            } else {
                showError(data?.message || "Error al registrar venta.");
            }
            return;
        }
        
        showSuccess(data?.message || "Venta registrada correctamente.");
        closeModal('registerModal');
        
        const saleForm = document.getElementById("saleForm");
        if (saleForm) {
            saleForm.reset();
        }
        
        state.productItems = [];
        updateProductItemsList();
        updateTotalAmount();
        listSales();
    } catch (err) {
        console.error("Error al registrar venta:", err);
        showError("Error al registrar venta: " + (err.message || "Error desconocido"));
    }
};

/**
 * Fill edit form with sale data
 * @param {string} id - ID of sale to edit
 */
const fillEditForm = async (id) => {
    try {
        const token = getAuthToken();
        if (!token) return;

        const confirmed = await showConfirm({
            title: "¿Deseas editar esta venta?",
            text: "Vas a modificar la información de esta venta.",
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

        // Load customers if not already loaded
        await loadCustomersForEdit();
        
        const res = await fetch(`${API.SALES}/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        let sale;
        try {
            sale = await res.json();
        } catch (err) {
            console.error("Error al leer la respuesta JSON:", err);
            if (!res.ok) {
                showError("Error al cargar los datos de la venta.");
                return;
            }
        }

        if (!res.ok) {
            showError(sale?.message || "Error al cargar los datos de la venta.");
            return;
        }
        
        const editIdInput = document.getElementById("editId");
        const editCustomerSelect = document.getElementById("editCustomer");
        const editSalesDateInput = document.getElementById("editSalesDate");
        const editTotalAmount = document.getElementById("editTotalAmount");
        const editStatusDisplay = document.getElementById("editStatusDisplay");
        
        if (!editIdInput || !editCustomerSelect || !editSalesDateInput || !editTotalAmount) {
            console.error("No se encontraron elementos necesarios para editar");
            return;
        }
        
        // Store the ID for update (could be _id or id)
        const saleId = sale._id || sale.id;
        editIdInput.value = saleId;
        
        // Set customer
        if (sale.customer) {
            const customerId = sale.customer._id || sale.customer.id;
            editCustomerSelect.value = customerId;
        }
        
        // Set sale date
        editSalesDateInput.value = sale.salesDate ? sale.salesDate.split('T')[0] : "";
        
        // Display current status if element exists
        if (editStatusDisplay) {
            const statusMap = {
                "pending": { text: "Pendiente", class: "status-pending" },
                "processing": { text: "En Proceso", class: "status-processing" },
                "completed": { text: "Completado", class: "status-completed" },
                "cancelled": { text: "Cancelado", class: "status-cancelled" }
            };
            
            const status = statusMap[sale.status] || { text: sale.status || "Desconocido", class: "" };
            editStatusDisplay.innerHTML = `<span class="status-badge ${status.class}">${status.text}</span>`;
        }
        
        // Display sale products
        displayEditProducts(sale.products);
        
        // Display total
        editTotalAmount.textContent = formatCurrency(sale.total);

        openModal("editModal");
    } catch (err) {
        console.error("Error al cargar la venta:", err);
        showError(`Ocurrió un error: ${err.message || "Error desconocido"}`);
    }
};

/**
 * Update a sale with new data
 * @param {Event} event - Form submit event
 */
const updateSale = async (event) => {
    if (event) event.preventDefault();
    
    try {
        const token = getAuthToken();
        if (!token) return;

        const saleId = document.getElementById("editId").value;
        const customer = document.getElementById("editCustomer").value;
        const salesDate = document.getElementById("editSalesDate").value;

        if (!customer || !salesDate) {
            showError("El cliente y la fecha son campos obligatorios.");
            return;
        }

        const confirmed = await showConfirm({
            title: "¿Confirmas actualizar esta venta?",
            text: "Se guardarán los cambios realizados.",
            confirmText: "Actualizar",
            cancelText: "Cancelar",
        });

        if (!confirmed) return;

        const res = await fetch(`${API.SALES}/${saleId}`, {
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

        let data;
        try {
            data = await res.json();
        } catch (err) {
            if (!res.ok) {
                showError("Error al actualizar la venta.");
                return;
            }
        }
        if (!res.ok) {
            // Show specific validation errors if available
            if (data && data.errors && Array.isArray(data.errors)) {
                showError(`Error de validación: ${data.errors.join(', ')}`);
            } else {
                showError(data?.message || "Error al actualizar la venta.");
            }
            return;
        }

        showSuccess(data?.message || "Venta actualizada correctamente.");
        closeModal("editModal");
        
        const editForm = document.getElementById("editForm");
        if (editForm) {
            editForm.reset();
        }
        
        listSales();
    } catch (err) {
        console.error("Error al actualizar venta:", err);
        showError(`Ocurrió un error: ${err.message || "Error desconocido"}`);
    }
};

/**
 * Update a sale's status
 * @param {string} id - ID of sale to update status
 */
const updateSaleStatus = async (id) => {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        // Get the sale details first to see current status
        const res = await fetch(`${API.SALES}/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        let sale;
        try {
            sale = await res.json();
        } catch (err) {
            console.error("Error al leer la respuesta JSON:", err);
            if (!res.ok) {
                showError("Error al cargar los datos de la venta.");
                return;
            }
        }

        if (!res.ok) {
            showError(sale?.message || "Error al cargar los datos de la venta.");
            return;
        }
        
        // Determine available status transitions based on current status
        const currentStatus = sale.status || "pending";
        
        const statusTransitions = {
            "pending": ["processing", "cancelled"],
            "processing": ["completed", "cancelled"],
            "completed": ["cancelled"],
            "cancelled": []
        };
        
        const availableStatuses = statusTransitions[currentStatus] || [];
        
        if (availableStatuses.length === 0) {
            showError(`No hay transiciones posibles desde el estado actual: ${currentStatus}`);
            return;
        }
        
        // Create options for status selection
        const statusOptions = {
            "processing": "Procesar venta",
            "completed": "Completar venta",
            "cancelled": "Cancelar venta"
        };
        
        // Create HTML input options for status selection
        let statusInputHtml = "";
        availableStatuses.forEach(status => {
            statusInputHtml += `
                <div class="status-option">
                    <input type="radio" id="status-${status}" name="status" value="${status}">
                    <label for="status-${status}">${statusOptions[status]}</label>
                </div>
            `;
        });
        
        // Show status change dialog with SweetAlert
        const result = await Swal.fire({
            title: 'Cambiar estado de venta',
            html: `
                <div class="status-change-form">
                    <p>Estado actual: <span class="current-status">${currentStatus}</span></p>
                    <p>Seleccione el nuevo estado:</p>
                    <div class="status-options">
                        ${statusInputHtml}
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Actualizar estado',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const selectedStatus = document.querySelector('input[name="status"]:checked');
                if (!selectedStatus) {
                    Swal.showValidationMessage('Debe seleccionar un estado');
                    return false;
                }
                return selectedStatus.value;
            }
        });
        
        if (!result.isConfirmed || !result.value) {
            return;
        }
        
        const newStatus = result.value;
        
        // Confirmar el cambio de estado
        const statusMessages = {
            "processing": "Se reducirá el stock de productos.",
            "completed": "La venta se marcará como completada.",
            "cancelled": "Se restaurará el stock de productos si la venta estaba en proceso."
        };
        
        const confirmed = await showConfirm({
            title: `¿Confirma cambiar el estado a "${newStatus}"?`,
            text: statusMessages[newStatus] || "Esta acción no se puede deshacer.",
            confirmText: "Cambiar",
            cancelText: "Cancelar"
        });
        
        if (!confirmed) return;
        
        // Send update request
        const updateRes = await fetch(`${API.SALES}/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
                status: newStatus
            }),
        });

        let updateData;
        try {
            updateData = await updateRes.json();
        } catch (err) {
            if (!updateRes.ok) {
                showError("Error al actualizar el estado de la venta.");
                return;
            }
        }
        
        if (!updateRes.ok) {
            showError(updateData?.message || "Error al actualizar el estado de la venta.");
            return;
        }

        showSuccess(updateData?.message || "Estado de venta actualizado correctamente.");
        listSales();
    } catch (err) {
        console.error("Error al actualizar estado de venta:", err);
        showError(`Ocurrió un error: ${err.message || "Error desconocido"}`);
    }
};

/**
 * Delete a sale
 * @param {string} id - ID of sale to delete
 */
const deleteSale = async (id) => {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        const confirmed = await showConfirm({
            title: "¿Estás seguro de eliminar esta venta?",
            text: "Esta acción no se puede deshacer. Solo se pueden eliminar ventas en estado pendiente o cancelado.",
            confirmText: "Eliminar",
            cancelText: "Cancelar"
        });
        
        if (!confirmed) return;

        const res = await fetch(`${API.SALES}/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        // For DELETE, check if response contains JSON
        let message = "Venta eliminada correctamente.";
        
        if (res.headers.get("content-type")?.includes("application/json")) {
            try {
                const data = await res.json();
                if (!res.ok) {
                    showError(data.message || "No se pudo eliminar la venta");
                    return;
                }
                
                // Use message from response if available
                if (data.message) {
                    message = data.message;
                }
            } catch (err) {
                console.error("Error al procesar la respuesta JSON:", err);
                if (!res.ok) {
                    showError("No se pudo eliminar la venta");
                    return;
                }
            }
        } else if (!res.ok) {
            // If no JSON but response is not ok
            showError("No se pudo eliminar la venta");
            return;
        }
        
        showSuccess(message);
        listSales();
    } catch (err) {
        console.error("Error al eliminar venta:", err);
        showError("Error al eliminar venta: " + (err.message || "Error desconocido"));
    }
};

/**
 * Search sales by term
 */
const searchSale = () => {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) {
        console.error("No se encontró el elemento de búsqueda");
        return;
    }
    
    const term = searchInput.value.toLowerCase().trim();
    
    if (!term) {
        state.sales.all = [...state.sales.original];
    } else {
        state.sales.all = state.sales.original.filter(s => {
            // Search in customer
            const customerMatch = s.customer?.name && s.customer.name.toLowerCase().includes(term);
            
            // Search in products
            const productsMatch = s.products && s.products.some(item => 
                item.product?.name && item.product.name.toLowerCase().includes(term)
            );
            
            // Search in sale ID
            const idMatch = (s.id && s.id.toLowerCase().includes(term));
            
            // Search in status
            const statusMatch = (s.status && s.status.toLowerCase().includes(term));
            
            return (
                customerMatch || 
                productsMatch ||
                idMatch ||
                statusMatch
            );
        });
    }
    
    state.sales.currentPage = 1;
    renderSalesTable(state.sales.currentPage);
};

// ===== REPORT GENERATION =====

/**
 * Open report modal with default dates
 */
const openReportModal = () => {
    // Set default dates: last month
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    const formatInputDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    const reportStartDate = document.getElementById("reportStartDate");
    const reportEndDate = document.getElementById("reportEndDate");
    
    if (reportStartDate && reportEndDate) {
        reportStartDate.value = formatInputDate(lastMonth);
        reportEndDate.value = formatInputDate(today);
    }
    
    // Set report status selector if exists
    const reportStatus = document.getElementById("reportStatus");
    if (reportStatus) {
        reportStatus.innerHTML = `
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="processing">En proceso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
        `;
    }
    
    openModal("reportModal");
};

/**
 * Generate PDF report with filters
 */
const generatePdfReport = async () => {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        // Show loading indicator
        Swal.fire({
            title: 'Generando informe...',
            text: 'Por favor espere mientras se genera el PDF',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Get filter values
        const startDate = document.getElementById("reportStartDate").value;
        const endDate = document.getElementById("reportEndDate").value;
        const customerId = document.getElementById("reportCustomer").value;
        const productId = document.getElementById("reportProduct")?.value;
        const status = document.getElementById("reportStatus")?.value;
        
        // Build URL with parameters
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        
        // Only include valid ObjectIds
        if (isValidObjectId(customerId)) {
            params.append("customerId", customerId);
        }
        
        if (isValidObjectId(productId)) {
            params.append("productId", productId);
        }
        
        if (status) {
            params.append("status", status);
        }
        
        const url = `${API.SALES}/export/pdf?${params.toString()}`;
        
        // Make request with token in header
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/pdf"
            }
        });
        
        if (!response.ok) {
            let errorMessage = `Error: ${response.status} - ${response.statusText}`;
            
            try {
                // Try to get error message in JSON format
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    const errorText = await response.text();
                    console.error("Error response:", errorText);
                }
            } catch (e) {
                console.error("Error al procesar respuesta de error:", e);
            }
            
            throw new Error(errorMessage);
        }
        
        // Get file blob
        const blob = await response.blob();
        
        // Check that blob is not empty
        if (blob.size === 0) {
            throw new Error("El archivo PDF generado está vacío");
        }
        
        // Create URL and force download
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `informe-ventas-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up resources
        setTimeout(() => {
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        }, 100);
        
        Swal.close();
        showSuccess("Informe PDF generado correctamente");
    } catch (error) {
        console.error("Error al generar informe PDF:", error);
        Swal.close();
        showError(`Error al generar informe: ${error.message}`);
    }
    
    closeModal("reportModal");
};

/**
 * Generate Excel report with filters
 */
const generateExcelReport = async () => {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        // Show loading indicator
        Swal.fire({
            title: 'Generando informe...',
            text: 'Por favor espere mientras se genera el Excel',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Get filter values
        const startDate = document.getElementById("reportStartDate").value;
        const endDate = document.getElementById("reportEndDate").value;
        const customerId = document.getElementById("reportCustomer").value;
        const productId = document.getElementById("reportProduct")?.value;
        const status = document.getElementById("reportStatus")?.value;
        
        // Build URL with parameters
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        
        // Only include valid ObjectIds
        if (isValidObjectId(customerId)) {
            params.append("customerId", customerId);
        }
        
        if (isValidObjectId(productId)) {
            params.append("productId", productId);
        }
        
        if (status) {
            params.append("status", status);
        }
        
        const url = `${API.SALES}/export/excel?${params.toString()}`;
        
        // Make request with token in header
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        });
        
        if (!response.ok) {
            let errorMessage = `Error: ${response.status} - ${response.statusText}`;
            
            try {
                // Try to get error message in JSON format
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    const errorText = await response.text();
                    console.error("Error response:", errorText);
                }
            } catch (e) {
                console.error("Error al procesar respuesta de error:", e);
            }
            
            throw new Error(errorMessage);
        }
        
        // Get file blob
        const blob = await response.blob();
        
        // Check that blob is not empty
        if (blob.size === 0) {
            throw new Error("El archivo Excel generado está vacío");
        }
        
        // Create URL and force download
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `informe-ventas-${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up resources
        setTimeout(() => {
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        }, 100);
        
        Swal.close();
        showSuccess("Informe Excel generado correctamente");
    } catch (error) {
        console.error("Error al generar informe Excel:", error);
        Swal.close();
        showError(`Error al generar informe: ${error.message}`);
    }
    
    closeModal("reportModal");
};

// ===== AUTHENTICATION HELPERS =====

/**
 * Check if user is authenticated
 * @returns {boolean} Whether user is authenticated
 */
const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("No se encontró token de autenticación");
        Swal.fire({
            icon: 'error',
            title: 'No autorizado',
            text: 'Debe iniciar sesión para acceder a esta página',
            confirmButtonText: 'Ir a login'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return false;
    }
    console.log("Usuario autenticado correctamente");
    return true;
};

// ===== INITIALIZATION =====

// Document ready handler
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado. Verificando autenticación...");
    if (!checkAuth()) return;
    
    try {
        // Initialize data
        listSales();
        loadProducts();
        loadCustomers();
        
        // Set up UI event handlers
        const setupUIEventHandlers = () => {
            // Button event handlers
            const buttons = {
                "mobileAddButton": () => openModal('registerModal'),
                "reportButton": openReportModal,
                "pdfReportButton": generatePdfReport,
                "excelReportButton": generateExcelReport,
                "registerButton": registerSale,
                "addProductButton": addProductItem
            };
            
            // Set handlers for each button
            Object.entries(buttons).forEach(([id, handler]) => {
                const button = document.getElementById(id);
                if (button) {
                    button.onclick = handler;
                } else {
                    console.warn(`No se encontró el botón con ID '${id}'`);
                }
            });
            
            // Form handlers
            const editForm = document.getElementById("editForm");
            if (editForm) {
                editForm.addEventListener("submit", updateSale);
            } else {
                console.warn("No se encontró el formulario de edición");
            }
            
            // Search input handler
            const searchInput = document.getElementById("searchInput");
            if (searchInput) {
                searchInput.addEventListener("keyup", searchSale);
            } else {
                console.warn("No se encontró el campo de búsqueda");
            }
        };
        
        setupUIEventHandlers();
        
        // Make functions available globally
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
    } catch (error) {
        console.error("Error al inicializar la página:", error);
        showError("Error al cargar la aplicación");
    }
});