// Endpoints de la API
const API_PRODUCTS = "http://localhost:3001/api/products";
const API_CATEGORIES = "http://localhost:3001/api/categories";

// Variables globales para productos y paginación
let allProducts = [];
let originalProducts = [];
let currentPage = 1;
const rowsPerPage = 10;

// Renderizar tabla de productos
const renderProductsTable = (page = 1) => {
  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const productsToShow = allProducts.slice(start, end);

  productsToShow.forEach(product => {
    tbody.innerHTML += `
      <tr>
      <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${product.category?.name || "Sin Categoría"}</td>
        <td>${product.price}</td>
        <td>${product.stock}</td>
        <td>${product.minimumStock}</td>
        <td>
            <label class="switch">
                <input type="checkbox" ${product.status === "active" ? "checked" : ""} disabled>
                <span class="slider round"></span>
            </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${product._id}')" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteProduct('${product._id}')" class="icon-button delete-button" title="Eliminar">
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
  const totalPages = Math.ceil(allProducts.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info:nth-child(2)");

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

// Listar productos desde el backend
const listProducts = async () => {
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
      renderProductsTable(currentPage);
    } else {
      showError(data.message || "Error al listar productos.");
    }
  } catch (err) {
    console.error("Error al listar productos:", err);
    showError("Error al listar productos");
  }
};

// Cargar las categorías para los selects (registro y edición)
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
      // Reiniciar opciones y agregar la opción predeterminada
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
    console.error("Error al cargar categorías:", err);
    showError("Error al cargar categorías.");
  }
};

// Mostrar formulario de registro
const showRegisterForm = () => {
  hideForms();
  document.getElementById("registerFormSection").style.display = "block";
  document.getElementById("formTitle").textContent = "Registrar Producto";
  window.scrollTo(0, document.body.scrollHeight);
};

// Ocultar formulario de registro
const hideRegisterForm = () => {
  document.getElementById("registerFormSection").style.display = "none";
  document.getElementById("productForm").reset();
};

// Registrar producto
const registerProduct = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    const name = document.getElementById("name").value.trim();
    const category = document.getElementById("category").value;
    const price = parseFloat(document.getElementById("price").value);
    const stock = parseInt(document.getElementById("stock").value);
    const minimumStock = parseInt(document.getElementById("minimumStock").value);
    // Para el registro, puedes definir el estado por defecto o bien incluirlo si lo tienes en el formulario.
    const status = document.getElementById("status") 
      ? (document.getElementById("status").checked ? "active" : "inactive")
      : "active"; // Si no existe el campo, se asigna "active" por defecto
  
    if (!name || !category || isNaN(price) || isNaN(stock) || isNaN(minimumStock)) {
      showValidation("Todos los campos son obligatorios y deben ser válidos.");
      return;
    }
  
    const confirmed = await showConfirm({
      title: "¿Confirmas registrar este producto?",
      text: "Se creará un nuevo producto con los datos proporcionados.",
      confirmText: "Registrar",
      cancelText: "Cancelar"
    });
  
    if (!confirmed) {
      Swal.fire({
        icon: 'info',
        title: 'Operación cancelada',
        text: 'No se ha registrado ningún producto',
      });
      hideRegisterForm();
      return;
    }
  
    try {
      const res = await fetch(API_PRODUCTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, category, price, stock, minimumStock, status })
      });
      const data = await res.json();
      if (res.status === 201 || res.ok) {
        showSuccess("Producto registrado correctamente.");
        hideRegisterForm();
        listProducts();
      } else {
        showError(data.message || "Error al registrar producto.");
      }
    } catch (err) {
      console.error("Error al registrar producto:", err);
      showError("Error al registrar producto");
    }
  };
  
// Llenar formulario de edición con datos del producto
// Llenar formulario de edición de producto
const fillEditForm = async (id) => {
    const token = localStorage.getItem("token");
    const confirmed = await showConfirm({
      title: "¿Deseas editar este producto?",
      text: "Vas a modificar la información de este producto.",
      confirmText: "Editar",
      cancelText: "Cancelar"
    });
    if (!confirmed) {
      Swal.fire({
        icon: 'info',
        title: 'Operación cancelada',
        text: 'No se editará este producto',
      });
      return;
    }
    try {
      const res = await fetch(`${API_PRODUCTS}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        showError(data.message || "Error al cargar los datos del producto.");
        return;
      }
      const product = await res.json();
      console.log("Producto cargado:", product);
      document.getElementById("editId").value = product._id;
      document.getElementById("editName").value = product.name || "";
      document.getElementById("editCategory").value = product.category?._id || "";
      document.getElementById("editPrice").value = product.price || "";
      document.getElementById("editStock").value = product.stock || "";
      document.getElementById("editMinimumStock").value = product.minimumStock || "";
      // Asignar estado: si está activo, marcar el switch
      document.getElementById("editStatus").checked = product.status === "active";

  
      hideForms();
      document.getElementById("editFormSection").style.display = "block";
      window.scrollTo(0, document.body.scrollHeight);
  
      const editForm = document.getElementById("editForm");
      editForm.onsubmit = async (event) => {
        event.preventDefault();
        await updateProduct(id);
      };
    } catch (err) {
      console.error("Error al cargar el producto:", err);
      showError(`Ocurrió un error: ${err.message || err}`);
    }
  };
  
  // Actualizar producto
  const updateProduct = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    const name = document.getElementById("editName").value.trim();
    const category = document.getElementById("editCategory").value;
    const price = parseFloat(document.getElementById("editPrice").value);
    const stock = parseInt(document.getElementById("editStock").value);
    const minimumStock = parseInt(document.getElementById("editMinimumStock").value);
    const status = document.getElementById("editStatus").checked ? "active" : "inactive";
  
    if (!name || !category || isNaN(price) || isNaN(stock) || isNaN(minimumStock)) {
      showValidation("Todos los campos son obligatorios y deben ser válidos.");
      return;
    }
  
    const confirmed = await showConfirm({
      title: "¿Confirmas actualizar este producto?",
      text: "Se guardarán los cambios realizados.",
      confirmText: "Actualizar",
      cancelText: "Cancelar"
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_PRODUCTS}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, category, price, stock, minimumStock, status })
      });
      const data = await res.json();
      console.log("Respuesta del servidor:", data);
      if (res.ok) {
        showSuccess("Producto actualizado correctamente.");
        hideForms();
        listProducts();
      } else {
        showError(data.message || "Error al actualizar el producto.");
      }
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      showError(`Ocurrió un error: ${err.message || err}`);
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
      showSuccess("Producto eliminado");
      listProducts();
    } else {
      showError(data.message || "No se pudo eliminar el producto");
    }
  } catch (err) {
    console.error("Error al eliminar producto:", err);
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

// Ocultar formularios (registro y edición)
const hideForms = () => {
  document.getElementById("registerFormSection").style.display = "none";
  document.getElementById("editFormSection").style.display = "none";
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  listProducts();
  loadCategories();
  document.getElementById("mobileAddButton").onclick = showRegisterForm;
  document.getElementById("registerButton").onclick = registerProduct;
  document.getElementById("searchInput").addEventListener("keyup", searchProduct);
});

// Hacer funciones globales si es necesario
window.fillEditForm = fillEditForm;
window.deleteProduct = deleteProduct;
