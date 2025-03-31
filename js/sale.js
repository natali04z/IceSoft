// Endpoints de la API
const API_SALES = "http://localhost:3001/api/sales";  // Cambié 'products' a 'sales'
const API_PRODUCTS = "http://localhost:3001/api/products";  // Puedes mantenerlo si necesitas consultar productos para las ventas

// Variables globales para ventas y paginación
let allSales = [];
let originalSales = [];
let currentPage = 1;
const rowsPerPage = 10;

// Renderizar tabla de ventas
const renderSalesTable = (page = 1) => {
  const tbody = document.getElementById("saleTableBody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const salesToShow = allSales.slice(start, end);

  salesToShow.forEach(sale => {
    tbody.innerHTML += `
      <tr>
        <td>${sale.id}</td>
        <td>${sale.customerName}</td>
        <td>${sale.date}</td>
        <td>${sale.totalAmount}</td>
        <td>${sale.status}</td>
        <td>
            <label class="switch">
                <input type="checkbox" ${sale.status === "completed" ? "checked" : ""} disabled>
                <span class="slider round"></span>
            </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${sale._id}')" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteSale('${sale._id}')" class="icon-button delete-button" title="Eliminar">
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
  const totalPages = Math.ceil(allSales.length / rowsPerPage);
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
  const endItem = Math.min(startItem + rowsPerPage - 1, allSales.length);
  info.innerHTML = `${startItem}-${endItem} de ${allSales.length}`;
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderSalesTable(currentPage);
};

// Listar ventas desde el backend
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
    const data = await res.json();
    if (res.ok) {
      originalSales = data.sales || data;
      allSales = [...originalSales];
      currentPage = 1;
      renderSalesTable(currentPage);
    } else {
      showError(data.message || "Error al listar ventas.");
    }
  } catch (err) {
    console.error("Error al listar ventas:", err);
    showError("Error al listar ventas");
  }
};

// Mostrar formulario de registro de venta
const showRegisterForm = () => {
  hideForms();
  document.getElementById("registerFormSection").style.display = "block";
  document.getElementById("formTitle").textContent = "Registrar Venta";
  window.scrollTo(0, document.body.scrollHeight);
};

// Ocultar formulario de registro
const hideRegisterForm = () => {
  document.getElementById("registerFormSection").style.display = "none";
  document.getElementById("saleForm").reset();
};

// Registrar venta
const registerSale = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  const customerName = document.getElementById("customerName").value.trim();
  const date = document.getElementById("date").value;
  const totalAmount = parseFloat(document.getElementById("totalAmount").value);
  const status = document.getElementById("status")
    ? (document.getElementById("status").checked ? "completed" : "pending")
    : "completed";

  if (!customerName || !date || isNaN(totalAmount)) {
    showValidation("Todos los campos son obligatorios y deben ser válidos.");
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
    hideRegisterForm();
    return;
  }

  try {
    const res = await fetch(API_SALES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ customerName, date, totalAmount, status })
    });
    const data = await res.json();
    if (res.status === 201 || res.ok) {
      showSuccess("Venta registrada correctamente.");
      hideRegisterForm();
      listSales();
    } else {
      showError(data.message || "Error al registrar venta.");
    }
  } catch (err) {
    console.error("Error al registrar venta:", err);
    showError("Error al registrar venta");
  }
};

// Llenar formulario de edición con datos de la venta
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");
  const confirmed = await showConfirm({
    title: "¿Deseas editar esta venta?",
    text: "Vas a modificar la información de esta venta.",
    confirmText: "Editar",
    cancelText: "Cancelar"
  });
  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se editará esta venta',
    });
    return;
  }
  try {
    const res = await fetch(`${API_SALES}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos de la venta.");
      return;
    }
    const sale = await res.json();
    document.getElementById("editId").value = sale._id;
    document.getElementById("editCustomerName").value = sale.customerName || "";
    document.getElementById("editDate").value = sale.date || "";
    document.getElementById("editTotalAmount").value = sale.totalAmount || "";
    document.getElementById("editStatus").checked = sale.status === "completed";

    hideForms();
    document.getElementById("editFormSection").style.display = "block";
    window.scrollTo(0, document.body.scrollHeight);

    const editForm = document.getElementById("editForm");
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateSale(id);
    };
  } catch (err) {
    console.error("Error al cargar la venta:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar venta
const updateSale = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  const customerName = document.getElementById("editCustomerName").value.trim();
  const date = document.getElementById("editDate").value;
  const totalAmount = parseFloat(document.getElementById("editTotalAmount").value);
  const status = document.getElementById("editStatus").checked ? "completed" : "pending";

  if (!customerName || !date || isNaN(totalAmount)) {
    showValidation("Todos los campos son obligatorios y deben ser válidos.");
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas actualizar esta venta?",
    text: "Se guardarán los cambios realizados.",
    confirmText: "Actualizar",
    cancelText: "Cancelar"
  });
  if (!confirmed) return;
  try {
    const res = await fetch(`${API_SALES}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ customerName, date, totalAmount, status })
    });
    const data = await res.json();
    if (res.ok) {
      showSuccess("Venta actualizada correctamente.");
      hideForms();
      listSales();
    } else {
      showError(data.message || "Error al actualizar la venta.");
    }
  } catch (err) {
    console.error("Error al actualizar venta:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Eliminar venta
const deleteSale = async (id) => {
  const token = localStorage.getItem("token");
  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar esta venta?",
    text: "Esta acción no se puede deshacer.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });
  if (!confirmed) return;
  try {
    const res = await fetch(`${API_SALES}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      showSuccess("Venta eliminada");
      listSales();
    } else {
      showError(data.message || "No se pudo eliminar la venta");
    }
  } catch (err) {
    console.error("Error al eliminar venta:", err);
    showError("Error al eliminar venta");
  }
};

// Buscar venta
const searchSale = () => {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  allSales = term
    ? originalSales.filter(s => s.customerName.toLowerCase().includes(term))
    : [...originalSales];
  currentPage = 1;
  renderSalesTable(currentPage);
};

// Ocultar formularios (registro y edición)
const hideForms = () => {
  document.getElementById("registerFormSection").style.display = "none";
  document.getElementById("editFormSection").style.display = "none";
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  listSales();
  document.getElementById("mobileAddButton").onclick = showRegisterForm;
  document.getElementById("registerButton").onclick = registerSale;
  document.getElementById("searchInput").addEventListener("keyup", searchSale);
});

// Hacer funciones globales si es necesario
window.fillEditForm = fillEditForm;
window.deleteSale = deleteSale;
