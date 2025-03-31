<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Categorías | ICESOFT</title>
  <link rel="icon" href="assets/icesoft.png" type="image/png">
  <link rel="stylesheet" href="css/style.css">
  <script src="js/alerts.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.materialdesignicons.com/6.5.95/css/materialdesignicons.min.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body class="dashboard-page">
  <section class="navLateral">
    <div class="navLateral-bg btn-menu"></div>
    <div class="navLateral-body">
      <div class="navLateral-body-logo">
        <a href="home.html">
          <img src="assets/icesoft.png" class="logo-img" alt="Logo">
        </a>
        <span class="logo-text">ICESOFT</span>
      </div>
      <nav>
        <ul class="menu-principal">
          <li><a href="home.html"><i class="material-icons">dashboard</i><span>DASHBOARD</span></a></li>
          <li class="divider-menu-h"></li>
          <li><a href="user.html"><i class="material-icons">person</i><span>USUARIO</span></a></li>
          <li class="divider-menu-h"></li>
          <li>
            <a href="#" class="btn-subMenu"><i class="material-icons">work</i><span>COMPRAS</span><span class="material-icons arrow">chevron_left</span></a>
            <ul class="sub-menu-options">
                <li><a href="category.html"><i class="material-icons">label</i><span>CATEGORÍAS</span></a></li>
                <li><a href="products.html"><i class="material-icons">local_offer</i><span>PRODUCTOS</span></a></li>
                <li><a href="providers.html"><i class="material-icons">local_shipping</i><span>PROVEEDORES</span></a></li>
                <li><a href="purchases.html"><i class="material-icons">shopping_cart</i><span>COMPRAS</span></a></li>
            </ul>
          </li>
          <li class="divider-menu-h"></li>
          <li>
            <a href="#" class="btn-subMenu"><i class="material-icons">attach_money</i><span>VENTAS</span><span class="material-icons arrow">chevron_left</span></a>
            <ul class="sub-menu-options">
              <li><a href="ventas.html"><i class="material-icons">receipt</i><span>FACTURACIÓN</span></a></li>
              <li><a href="clientes.html"><i class="material-icons">people</i><span>CLIENTES</span></a></li>
            </ul>
          </li>
        </ul>
      </nav>
      <div class="logout-button">
        <a href="#" onclick="logout()"><i class="material-icons">logout</i></a>
      </div>
    </div>
  </section>

  <header class="dashboard-header">
    <button class="open-menu-btn btn-menu"><i class="material-icons">menu</i></button>
    <div class="user-dropdown-container">
      <div class="user-info" onclick="toggleUserDropdown()">
        <i class="material-icons user-icon">account_circle</i>
        <span class="user-name" id="loggedUserName">Usuario</span>
        <i class="material-icons arrow-icon">expand_more</i>
      </div>
      <div class="user-dropdown-menu" id="userDropdownMenu" style="display: none;">
        <a href="configuracion.html"><i class="material-icons">settings</i> Configuración</a>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="container">
      <h2 class="title">Gestión de Categorías</h2>

      <!-- Search container -->
      <div class="search-container">
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Buscar categoría..." oninput="searchCategory()">
          <button onclick="searchCategory()"><i class="material-icons">search</i></button>
        </div>
      </div>

      <!-- Tabla de Usuarios -->
      <section class="table-card">
        <div class="card-header card-header-flex">
          <h3>Listado de Categorías</h3>
          <button type="button" class="add-button" id="mobileAddButton">
            <i class="material-icons">person_add</i> Añadir
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="categoryTableBody">
                <!-- Aquí se insertarán las categorías -->
            </tbody>
            </table>
          </div>
          <div class="pagination">
            <div class="page-info">Mostrando <span style="font-weight: 500;">10 filas</span></div>
            <div class="page-info">1-10 de 0</div>
            <div class="page-numbers"></div>
          </div>
        </div>
      </section>

      <!-- Formulario de Registro -->
      <!-- Modal de Registro -->
      <div id="registerModal" class="modal">
        <div class="modal-content">
          <span class="close" onclick="closeModal('registerModal')">&times;</span>
          <section class="form-card">
            <div class="card-header">
              <h3 id="formTitle">Registrar Categoría</h3>
            </div>
            <div class="card-body">
              <form id="userForm">
                <div class="form-field">
                  <input type="text" class="field-element" id="name" placeholder="Nombre">
                </div>
                <div class="form-field">
                  <input type="text" class="field-element" id="description" placeholder="Descripción">
                </div>
                <div class="form-field">
                  <label>Estado:</label>
                  <label class="switch">
                    <input type="checkbox" id="status">
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="controls-container">
                  <button type="button" class="action-button" id="registerButton">Registrar</button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>

      <!-- Modal de Edición -->
      <div id="editModal" class="modal">
        <div class="modal-content">
          <span class="close" onclick="closeModal('editModal')">&times;</span>
          <section class="form-card">
            <div class="card-header">
              <h3 id="editFormTitle">Editar Categoría</h3>
            </div>
            <div class="card-body">
              <form id="editForm">
                <input type="hidden" id="editId">
                <div class="form-field">
                  <input type="text" class="field-element" id="editName" placeholder="Nombre">
                </div>
                <div class="form-field">
                  <input type="text" class="field-element" id="editDescription" placeholder="Descripción">
                </div>
                <div class="form-field">
                  <label>Estado:</label>
                  <label class="switch">
                    <input type="checkbox" id="editStatus">
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="controls-container">
                  <button type="button" class="action-button" id="editButton" onclick="updateCategory()">Actualizar</button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>

  <script src="js/menu.js"></script>
  <script src="js/category.js"></script>
</body>
</html>
