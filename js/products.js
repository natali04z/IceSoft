const API_PRODUCTS = "https://backend-yy4o.onrender.com/api/products";
const API_CATEGORIES = "https://backend-yy4o.onrender.com/api/categories";

// Variables globales para productos y paginación
let allProducts = [];
let originalProducts = [];
let currentPage = 1;
const rowsPerPage = 10;

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

// Función para abrir un modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";

  if (modalId === 'registerModal') {
    clearValidationErrors('productForm');
    document.getElementById("productForm").reset();
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
  }
}

// Función para cerrar un modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Función para formatear fechas en formato DD/MM/YYYY
function formatDateForDisplay(dateString) {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
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

// Renderizar tabla de productos
const renderProductsTable = (page = 1) => {
  const tbody = document.getElementById("productTableBody");
  if (!tbody) {
    return;
  }
  
  tbody.innerHTML = "";

  if (!allProducts || allProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">No hay productos disponibles</td></tr>`;
    return;
  }

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const productsToShow = allProducts.slice(start, end);

  const userPermissions = getUserPermissions();
  const canEditProducts = userPermissions.includes("edit_products");

  productsToShow.forEach(product => {
    const formattedBatchDate = product.formattedBatchDate || formatDateForDisplay(product.batchDate);
    const formattedExpirationDate = product.formattedExpirationDate || formatDateForDisplay(product.expirationDate);
    
    tbody.innerHTML += `
      <tr data-productid="${product._id}">
        <td>${product.id || ''}</td>
        <td>${product.name || ''}</td>
        <td>${product.category?.name || ''}</td>
        <td>${product.formattedPrice || formatPrice(product.price) || ''}</td>
        <td>${product.stock || 0}</td>
        <td>${formattedBatchDate}</td>
        <td>${formattedExpirationDate}</td>
        <td>
          <label class="switch">
            <input type="checkbox" ${product.status === "active" ? "checked" : ""} 
              ${canEditProducts ? `onchange="updateProductStatus('${product._id}', this.checked ? 'active' : 'inactive')"` : 'disabled'}>
            <span class="slider round"></span>
          </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${product._id}')" class="icon-button edit-button" title="Editar" ${canEditProducts ? '' : 'disabled'}>
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteProduct('${product._id}')" class="icon-button delete-button" title="Eliminar" ${userPermissions.includes("delete_products") ? '' : 'disabled'}>
              <i class="material-icons">delete</i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  renderPaginationControls();
};

// Renderizar controles de paginación
const renderPaginationControls = () => {
  if (!allProducts || allProducts.length === 0) {
    return;
  }
  
  const totalPages = Math.ceil(allProducts.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info:nth-child(2)");
  
  if (!container || !info) {
    return;
  }

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
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);

  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(startItem + rowsPerPage - 1, allProducts.length);
  info.innerHTML = `${startItem}-${endItem} de ${allProducts.length}`;
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderProductsTable(currentPage);
};

// Formatear precio en formato colombiano
const formatPrice = (price) => {
  if (!price) return "$0";
  return `$${parseFloat(price).toLocaleString('es-CO')}`;
};

const loadCategories = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
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
      showError(data.message || "Error al cargar categorías.");
    }
  } catch (err) {
    showError("Error al cargar categorías.");
  }
};

const loadProductsInternal = async () => {
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
    
    const data = await res.json();
    
    if (res.ok) {
      originalProducts = data.products || data;
      allProducts = [...originalProducts];
      currentPage = 1;

      allProducts = allProducts.map(product => {
        const formattedProduct = {...product};
        
        formattedProduct.formattedPrice = formatPrice(product.price);
        
        if (product.batchDate) {
          formattedProduct.formattedBatchDate = formatDateForDisplay(product.batchDate);
        }
        
        if (product.expirationDate) {
          formattedProduct.formattedExpirationDate = formatDateForDisplay(product.expirationDate);
        }
        
        return formattedProduct;
      });
      
      renderProductsTable(currentPage);
    } else {
      showError(data.message || "Error al listar productos.");
    }
  } catch (err) {
    showError("Error al listar productos: " + (err.message || err));
  }
};

// Listar productos con indicador de carga (solo para carga inicial)
const listProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
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
    
    const data = await res.json();
    
    hideLoadingIndicator();
    
    if (res.ok) {
      originalProducts = data.products || data;
      allProducts = [...originalProducts];
      currentPage = 1;

      allProducts = allProducts.map(product => {
        const formattedProduct = {...product};
        
        formattedProduct.formattedPrice = formatPrice(product.price);
        
        if (product.batchDate) {
          formattedProduct.formattedBatchDate = formatDateForDisplay(product.batchDate);
        }
        
        if (product.expirationDate) {
          formattedProduct.formattedExpirationDate = formatDateForDisplay(product.expirationDate);
        }
        
        return formattedProduct;
      });
      
      renderProductsTable(currentPage);
    } else {
      showError(data.message || "Error al listar productos.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar productos: " + (err.message || err));
  }
};

// Registrar producto
const registerProduct = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
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
  const price = parseFloat(document.getElementById("price").value);
  
  const statusElement = document.getElementById("status");
  const status = statusElement ? (statusElement.checked ? "active" : "inactive") : "active";
  
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
        status,
        batchDate,
        expirationDate
      })
    });
    const data = await res.json();
    if (res.status === 201 || res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Producto registrado correctamente.`,
        showConfirmButton: true,
      });
      closeModal('registerModal');
      document.getElementById("productForm").reset();
      loadProductsInternal(); // Cambiado por la versión sin indicador de carga
    } else {
      showError(data.message || "Error al registrar producto.");
    }
  } catch (err) {
    showError("Error al registrar producto");
  }
};

// Llenar formulario de edición de producto
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");

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
    document.getElementById("editStock").value = product.stock || "";
    
    const editStatusElement = document.getElementById("editStatus");
    if (editStatusElement) {
      editStatusElement.checked = product.status === "active";
    }
   
    if (product.batchDate) {
      const batchDate = new Date(product.batchDate);
      document.getElementById("editBatchDate").value = batchDate.toISOString().split('T')[0];
    }
    
    if (product.expirationDate) {
      const expirationDate = new Date(product.expirationDate);
      document.getElementById("editExpirationDate").value = expirationDate.toISOString().split('T')[0];
    }

    openModal("editModal");
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar producto
const updateProduct = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const nameValid = validateField("editName", "El nombre es obligatorio.");
  const categoryValid = validateCategory("editCategory");
  const priceValid = validatePrice("editPrice");
  const stockValid = validateStock("editStock");
  const batchDateValid = validateDate("editBatchDate");
  const expirationDateValid = validateDate("editExpirationDate");
  const dateRangeValid = validateDateRange("editBatchDate", "editExpirationDate");

  if (!nameValid || !categoryValid || !priceValid || !stockValid || !batchDateValid || !expirationDateValid || !dateRangeValid) {
    return;
  }

  const productId = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const category = document.getElementById("editCategory").value;
  const price = parseFloat(document.getElementById("editPrice").value);
  const stock = parseInt(document.getElementById("editStock").value);

  const editStatusElement = document.getElementById("editStatus");
  const status = editStatusElement ? (editStatusElement.checked ? "active" : "inactive") : "active";
  
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
        stock,
        status,
        batchDate,
        expirationDate
      }),
    });

    const data = await res.json();
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Producto actualizado correctamente.`,
        showConfirmButton: true,
      });
      closeModal("editModal");
      document.getElementById("editForm").reset();
      loadProductsInternal(); // Cambiado por la versión sin indicador de carga
    } else {
      showError(data.message || "Error al actualizar el producto.");
    }
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar solo el estado de un producto
const updateProductStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  try {
    const res = await fetch(`${API_PRODUCTS}/${id}`, {
      method: "PUT",
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
        text: `Producto ${status === 'active' ? 'activado' : 'desactivado'} correctamente.`,
        showConfirmButton: true,
      });
      
      loadProductsInternal(); // Cambiado por la versión sin indicador de carga
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} el producto (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);

      loadProductsInternal(); // Cambiado por la versión sin indicador de carga
    }
  } catch (err) {
    showError(`Ocurrió un error de red: ${err.message || err}`);
    loadProductsInternal(); // Cambiado por la versión sin indicador de carga
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
        Swal.fire({
          icon: 'warning',
          title: 'Producto inactivo',
          text: 'Este producto está desactivado y no puede ser utilizado.'
        });
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
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Producto eliminado correctamente.`,
        showConfirmButton: true,
      });
      loadProductsInternal(); // Cambiado por la versión sin indicador de carga
    } else {
      showError(data.message || "No se pudo eliminar el producto");
    }
  } catch (err) {
    showError("Error al eliminar producto");
  }
};

// Buscar producto
const searchProduct = () => {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  allProducts = term
    ? originalProducts.filter(p => p.name.toLowerCase().includes(term))
    : [...originalProducts];
  currentPage = 1;
  renderProductsTable(currentPage);
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  disableNativeBrowserValidation();
  
  const productTableBody = document.getElementById("productTableBody");
  if (!productTableBody) {
    return;
  }
  
  // Iniciar carga de datos
  try {
    listProducts(); // Usa el indicador de carga para la carga inicial
    loadCategories();
  } catch (err) {
    console.error("Error al inicializar:", err);
  }
  
  // Configurar botones y eventos
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
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
  
  // Validación en tiempo real - Formulario de registro
  document.getElementById("name").addEventListener("blur", () => validateField("name", "El nombre es obligatorio."));
  document.getElementById("category").addEventListener("change", () => validateCategory("category"));
  document.getElementById("price").addEventListener("blur", () => validatePrice("price"));
  document.getElementById("batchDate").addEventListener("change", () => {
    validateDate("batchDate");
    validateDateRange("batchDate", "expirationDate");
  });
  document.getElementById("expirationDate").addEventListener("change", () => {
    validateDate("expirationDate");
    validateDateRange("batchDate", "expirationDate");
  });
  
  // Validación en tiempo real - Formulario de edición
  document.getElementById("editName").addEventListener("blur", () => validateField("editName", "El nombre es obligatorio."));
  document.getElementById("editCategory").addEventListener("change", () => validateCategory("editCategory"));
  document.getElementById("editPrice").addEventListener("blur", () => validatePrice("editPrice"));
  document.getElementById("editStock").addEventListener("blur", () => validateStock("editStock"));
  document.getElementById("editBatchDate").addEventListener("change", () => {
    validateDate("editBatchDate");
    validateDateRange("editBatchDate", "editExpirationDate");
  });
  document.getElementById("editExpirationDate").addEventListener("change", () => {
    validateDate("editExpirationDate");
    validateDateRange("editBatchDate", "editExpirationDate");
  });
});

// Hacer funciones globales 
window.fillEditForm = fillEditForm;
window.deleteProduct = deleteProduct;
window.openModal = openModal;
window.closeModal = closeModal;
window.updateProductStatus = updateProductStatus;
window.updateProduct = updateProduct;