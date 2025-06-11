const API_PRODUCTS = "https://backend-delta-sable.vercel.app/api/products";
const API_CATEGORIES = "https://backend-delta-sable.vercel.app/api/categories";

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

// Función para validar precio
function validatePrice(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  const price = parseFloat(field.value);
  
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
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value) {
    errorElement.textContent = "Debe seleccionar una categoría.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
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
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
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
  return `$${parseFloat(price).toLocaleString('es-CO')}`;
};

// ✅ NUEVA IMPLEMENTACIÓN - usando la función helper para DD/MM/YYYY
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
      
      // ✅ NUEVA IMPLEMENTACIÓN - usando la función helper para formatear fechas
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

// Registrar producto
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

  if (!nameValid || !categoryValid || !priceValid || !batchDateValid || !expirationDateValid || !dateRangeValid) {
    return;
  }
  
  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value;
  const price = parseInt(document.getElementById("price").value);
  const batchDate = document.getElementById("batchDate").value;
  const expirationDate = document.getElementById("expirationDate").value;

  try {
    const res = await fetch(API_PRODUCTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        name, 
        category, 
        price, 
        batchDate,
        expirationDate
      })
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

// Llenar formulario de edición de producto
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
    document.getElementById("editCategory").value = product.category?._id || "";
    document.getElementById("editPrice").value = product.price || "";
   
    // ✅ NUEVA IMPLEMENTACIÓN - manejo de fechas mejorado
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

// Actualizar producto
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

  if (!nameValid || !categoryValid || !priceValid || !batchDateValid || !expirationDateValid || !dateRangeValid) {
    return;
  }

  const productId = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const category = document.getElementById("editCategory").value;
  const price = parseInt(document.getElementById("editPrice").value);
  const batchDate = document.getElementById("editBatchDate").value;
  const expirationDate = document.getElementById("editExpirationDate").value;

  try {
    const res = await fetch(`${API_PRODUCTS}/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        name, 
        category, 
        price,
        batchDate,
        expirationDate
      }),
    });

    const data = await res.json();
    if (res.ok) {
      showSuccess('El producto ha sido actualizado');
      
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
    priceField.addEventListener("blur", () => validatePrice("price"));
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
    editPriceField.addEventListener("blur", () => validatePrice("editPrice"));
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
  
  // Debug: Verificar funciones antes de llamarlas
  console.log('Checking notification functions...');
  console.log('ensureNotificationManager:', typeof window.ensureNotificationManager);
  console.log('getExpirationNotifications:', typeof window.getExpirationNotifications);
  
  // Inicializar notificaciones con debug
  setTimeout(() => {
      console.log('Initializing notifications...');
      
      if (typeof window.ensureNotificationManager === 'function') {
          console.log('Calling ensureNotificationManager...');
          window.ensureNotificationManager();
      } else {
          console.error('ensureNotificationManager not found!');
      }
      
      if (typeof window.getExpirationNotifications === 'function') {
          console.log('Calling getExpirationNotifications...');
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