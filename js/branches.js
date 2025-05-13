const API_URL = "https://backend-icesoft.onrender.com/api/branches";
  
// Variables globales
let branches = [];
let currentPage = 1;
const rowsPerPage = 10;

// Función para abrir el modal de registro
function openRegisterModal() {
  const modal = document.getElementById('registerModal');
  modal.style.display = 'flex'; // Usando flex para centrar el modal
  document.getElementById('formTitle').textContent = 'Registrar Sucursal';
  document.getElementById('branchForm').reset();
}

// Función para cerrar cualquier modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Función para registrar una nueva sucursal
function registerBranch() {
  // Obtener valores del formulario
  const name = document.getElementById('name').value;
  const address = document.getElementById('address').value;
  const phone = document.getElementById('phone').value;
  const location = document.getElementById('location') ? document.getElementById('location').value : '';
  
  // Validar campos
  if (!name || !address || !phone) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Todos los campos son obligatorios'
    });
    return;
  }
  
  // Generar ID único (usamos max id + 1 para evitar duplicados)
  const newId = branches.length > 0 ? Math.max(...branches.map(b => b.id)) + 1 : 1;
  
  // Crear objeto de nueva sucursal
  const newBranch = {
    id: newId,
    name: name,
    address: address,
    phone: phone,
    location: location,
    status: true
  };
  
  // Añadir a la lista de sucursales
  branches.push(newBranch);
  
  // Guardar en localStorage
  localStorage.setItem('branches', JSON.stringify(branches));
  
  // Actualizar la tabla
  loadBranches();
  
  // Cerrar el modal
  closeModal('registerModal');
  
  // Mostrar mensaje de éxito
  Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: 'Sucursal registrada correctamente'
  });
}

// Función para cargar las sucursales en la tabla
function loadBranches() {
  const tableBody = document.getElementById('branchTableBody');
  tableBody.innerHTML = '';
  
  // Si no hay sucursales, mostrar mensaje
  if (branches.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="text-center">No hay sucursales registradas</td>';
    tableBody.appendChild(row);
    return;
  }
  
  // Calcular índices para paginación
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, branches.length);
  
  // Mostrar sucursales para la página actual
  for (let i = startIndex; i < endIndex; i++) {
    const branch = branches[i];
    const row = document.createElement('tr');
    
    // Crear el switch para el estado
    const statusChecked = branch.status ? 'checked' : '';
    
    row.innerHTML = `
      <td>${branch.id}</td>
      <td>${branch.name}</td>
      <td>${branch.address}</td>
      <td>${branch.phone}</td>
      <td>
         <label class="switch">
            <input type="checkbox" ${statusChecked} onchange="toggleBranchStatus(${branch.id}, this.checked)">
            <span class="slider round"></span>
          </label>
        </td>
        <td>
          <div class="action-buttons">
            <button onclick="openEditModal(${branch.id})" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deleteBranch(${branch.id})" class="icon-button delete-button" title="Eliminar">
              <i class="material-icons">delete</i>
            </button>
          </div>
        </td>
      </tr>
    `;
    
    tableBody.appendChild(row);
  }
  
  // Actualizar información de paginación
  updatePagination();
}

// Función para actualizar la información de paginación
function updatePagination() {
  const totalPages = Math.ceil(branches.length / rowsPerPage);
  const pageInfo = document.querySelector('.pagination .page-info:nth-child(2)');
  const pageNumbers = document.querySelector('.pagination .page-numbers');
  
  // Actualizar texto de información
  const startIndex = branches.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * rowsPerPage, branches.length);
  pageInfo.textContent = `${startIndex}-${endIndex} de ${branches.length}`;
  
  // Crear botones de paginación
  pageNumbers.innerHTML = '';
  
  // Botón anterior
  const prevButton = document.createElement('button');
  prevButton.className = 'page-btn';
  prevButton.innerHTML = '<i class="material-icons">chevron_left</i>';
  prevButton.disabled = currentPage === 1;
  prevButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadBranches();
    }
  };
  pageNumbers.appendChild(prevButton);
  
  // Números de página - mostrar máximo 10 páginas
  const maxPagesToShow = 10;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Ajustar el rango si estamos en los extremos
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  // Añadir primera página y puntos suspensivos si es necesario
  if (startPage > 1) {
    const firstPageBtn = document.createElement('button');
    firstPageBtn.textContent = '1';
    firstPageBtn.className = 'page-btn';
    firstPageBtn.onclick = () => {
      currentPage = 1;
      loadBranches();
    };
    pageNumbers.appendChild(firstPageBtn);
    
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.className = 'ellipsis';
      pageNumbers.appendChild(ellipsis);
    }
  }
  
  // Números de página
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.className = 'page-btn';
    if (i === currentPage) {
      pageButton.classList.add('active');
    }
    pageButton.onclick = () => {
      currentPage = i;
      loadBranches();
    };
    pageNumbers.appendChild(pageButton);
  }
  
  // Añadir última página y puntos suspensivos si es necesario
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.className = 'ellipsis';
      pageNumbers.appendChild(ellipsis);
    }
    
    const lastPageBtn = document.createElement('button');
    lastPageBtn.textContent = totalPages;
    lastPageBtn.className = 'page-btn';
    lastPageBtn.onclick = () => {
      currentPage = totalPages;
      loadBranches();
    };
    pageNumbers.appendChild(lastPageBtn);
  }
  
  // Botón siguiente
  const nextButton = document.createElement('button');
  nextButton.className = 'page-btn';
  nextButton.innerHTML = '<i class="material-icons">chevron_right</i>';
  nextButton.disabled = currentPage === totalPages || totalPages === 0;
  nextButton.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadBranches();
    }
  };
  pageNumbers.appendChild(nextButton);
}

// Función para abrir el modal de edición
function openEditModal(id) {
  const branch = branches.find(b => b.id === id);
  if (!branch) return;
  
  document.getElementById('editId').value = branch.id;
  document.getElementById('editName').value = branch.name;
  document.getElementById('editAddress').value = branch.address;
  document.getElementById('editPhone').value = branch.phone;
  document.getElementById('editStatus').checked = branch.status;
  
  const modal = document.getElementById('editModal');
  modal.style.display = 'flex'; // Usando flex para centrar el modal
}

// Función para actualizar una sucursal
function updateBranch() {
  const id = parseInt(document.getElementById('editId').value);
  const name = document.getElementById('editName').value;
  const address = document.getElementById('editAddress').value;
  const phone = document.getElementById('editPhone').value;
  const status = document.getElementById('editStatus').checked;
  
  // Validar campos
  if (!name || !address || !phone) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Todos los campos son obligatorios'
    });
    return;
  }
  
  // Buscar y actualizar la sucursal
  const index = branches.findIndex(b => b.id === id);
  if (index !== -1) {
    branches[index] = {
      ...branches[index],
      name,
      address,
      phone,
      status
    };
    
    // Guardar en localStorage
    localStorage.setItem('branches', JSON.stringify(branches));
    
    // Actualizar la tabla
    loadBranches();
    
    // Cerrar el modal
    closeModal('editModal');
    
    // Mostrar mensaje de éxito
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: 'Sucursal actualizada correctamente'
    });
  }
}

// Función para eliminar una sucursal
function deleteBranch(id) {
  Swal.fire({
    title: '¿Está seguro?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      // Eliminar la sucursal
      branches = branches.filter(b => b.id !== id);
      
      // Guardar en localStorage
      localStorage.setItem('branches', JSON.stringify(branches));
      
      // Si la página actual ya no tiene elementos, ir a la página anterior
      const totalPages = Math.ceil(branches.length / rowsPerPage);
      if (currentPage > totalPages && currentPage > 1) {
        currentPage = totalPages || 1;
      }
      
      // Actualizar la tabla
      loadBranches();
      
      // Mostrar mensaje de éxito
      Swal.fire(
        'Eliminada',
        'La sucursal ha sido eliminada',
        'success'
      );
    }
  });
}

// Función para buscar sucursales
function searchBranch() {
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  
  // Si el campo está vacío, mostrar todas las sucursales
  if (!searchValue.trim()) {
    loadBranches();
    return;
  }
  
  // Filtrar sucursales que coincidan con la búsqueda
  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchValue) || 
    branch.address.toLowerCase().includes(searchValue) || 
    branch.phone.toLowerCase().includes(searchValue)
  );
  
  // Mostrar resultados filtrados
  const tableBody = document.getElementById('branchTableBody');
  tableBody.innerHTML = '';
  
  if (filteredBranches.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="text-center">No se encontraron resultados</td>';
    tableBody.appendChild(row);
    return;
  }
  
  filteredBranches.forEach(branch => {
    const row = document.createElement('tr');
    // Asegurarse de incluir el estado en los resultados de búsqueda
    const statusChecked = branch.status ? 'checked' : '';
    
    row.innerHTML = `
      <td>${branch.id}</td>
      <td>${branch.name}</td>
      <td>${branch.address}</td>
      <td>${branch.phone}</td>
      <td>
        <label class="switch">
          <input type="checkbox" ${statusChecked} onchange="toggleBranchStatus(${branch.id}, this.checked)">
          <span class="slider round"></span>
        </label>
      </td>
      <td>
        <div class="action-buttons">
          <button onclick="openEditModal(${branch.id})" class="icon-button edit-button" title="Editar">
            <i class="material-icons">edit</i>
          </button>
          <button onclick="deleteBranch(${branch.id})" class="icon-button delete-button" title="Eliminar">
            <i class="material-icons">delete</i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Función para cambiar el estado de una sucursal
function toggleBranchStatus(id, status) {
  const index = branches.findIndex(b => b.id === id);
  if (index !== -1) {
    branches[index].status = status;
    
    // Guardar en localStorage
    localStorage.setItem('branches', JSON.stringify(branches));
    
    // Opcional: Mostrar notificación
    Swal.fire({
      icon: 'success',
      title: 'Estado actualizado',
      text: `La sucursal ha sido ${status ? 'activada' : 'desactivada'}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
  // Intentar cargar sucursales desde localStorage
  const savedBranches = localStorage.getItem('branches');
  
  if (savedBranches) {
    // Si hay datos guardados, usarlos
    branches = JSON.parse(savedBranches);
  } else {
    // Si no hay datos guardados, inicializar como un arreglo vacío
    branches = [];
    
    // Guardar en localStorage
    localStorage.setItem('branches', JSON.stringify(branches));
  }
  
  // Cargar la tabla inicial
  loadBranches();
  
  // Añadir event listeners
  if (document.getElementById('mobileAddButton')) {
    document.getElementById('mobileAddButton').addEventListener('click', openRegisterModal);
  }
  
  // Botón para agregar sucursal (versión desktop)
  if (document.getElementById('addButton')) {
    document.getElementById('addButton').addEventListener('click', openRegisterModal);
  }
  
  // Botón para registrar una nueva sucursal
  if (document.getElementById('registerButton')) {
    document.getElementById('registerButton').addEventListener('click', registerBranch);
  }
  
  // Botón para actualizar una sucursal existente
  if (document.getElementById('updateButton')) {
    document.getElementById('updateButton').addEventListener('click', updateBranch);
  }
  
  // Event listener para buscar con Enter
  if (document.getElementById('searchInput')) {
    document.getElementById('searchInput').addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        searchBranch();
      }
    });
  }
  
  // Botón de búsqueda
  if (document.getElementById('searchButton')) {
    document.getElementById('searchButton').addEventListener('click', searchBranch);
  }
});

// Función para cerrar sesión
function logout() {
  Swal.fire({
    title: '¿Está seguro?',
    text: '¿Desea cerrar sesión?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      // Aquí iría tu código para cerrar sesión
      window.location.href = 'index.html';
    }
  });
}