<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Usuarios | ICESOFT</title>
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
              <li><a href="categorias.html"><i class="material-icons">label</i><span>CATEGORÍAS</span></a></li>
              <li><a href="productos.html"><i class="material-icons">local_offer</i><span>PRODUCTOS</span></a></li>
              <li><a href="proveedores.html"><i class="material-icons">local_shipping</i><span>PROVEEDORES</span></a></li>
              <li><a href="compras.html"><i class="material-icons">shopping_cart</i><span>COMPRAS</span></a></li>
            </ul>
          </li>
          <li class="divider-menu-h"></li>
          <li>
            <a href="#" class="btn-subMenu"><i class="material-icons">attach_money</i><span>VENTAS</span><span class="material-icons arrow">chevron_left</span></a>
            <ul class="sub-menu-options">
              <li><a href="sale.html"><i class="material-icons">receipt</i><span>COMPROBANTE DE PAGO</span></a></li>
              <li><a href="customer.html"><i class="material-icons">people</i><span>CLIENTES</span></a></li>
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
      <h2 class="title">Gestión de Clientes</h2>

      <!-- Search container -->
      <div class="search-container">
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Buscar cliente...">
          <button onclick="buscarCliente()"><i class="material-icons">search</i></button>
        </div>
      </div>

      <!-- Tabla de Clientes -->
      <section class="table-card">
        <div class="card-header card-header-flex">
          <h3>Listado de Clientes</h3>
          <button type="button" class="add-button" id="addClienteButton">
            <i class="material-icons">person_add</i> Nuevo Cliente
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Fecha de Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="clienteTableBody">
                <!-- Clientes cargados dinámicamente -->
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

      <!-- Formulario de Creación de Cliente -->
      <section class="form-card" id="clienteFormSection" style="display: none;">
        <div class="card-header">
          <h3 id="formTitle">Registrar Cliente</h3>
        </div>
        <div class="card-body">
          <form id="clienteForm">
            <div class="input-box">
              <input type="text" class="input-control" id="nombre" placeholder="Nombre del Cliente">
            </div>
            <div class="input-box">
              <input type="text" class="input-control" id="telefono" placeholder="Teléfono">
            </div>
            <div class="input-box">
              <input type="date" class="input-control" id="fecha" placeholder="Fecha de Creación">
            </div>
            <div class="button-group">
              <button type="button" class="btn" id="saveClienteButton">Guardar</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </main>

  <style>
    .clientes-table th {
      padding: 10px 15px; /* Espaciado interno para separar títulos */
      text-align: left; /* Alinear el texto a la izquierda */
      border-bottom: 2px solid #ddd; /* Línea separadora */
    }

    .clientes-table th:nth-child(1),
    .clientes-table td:nth-child(1) {
      width: 10%; /* Ajustar ancho de la columna ID */
    }

    .clientes-table th:nth-child(2),
    .clientes-table td:nth-child(2) {
      width: 30%; /* Ajustar ancho de la columna Nombre */
    }

    .clientes-table th:nth-child(3),
    .clientes-table td:nth-child(3) {
      width: 20%; /* Ajustar ancho de la columna Teléfono */
    }

    .clientes-table th:nth-child(4),
    .clientes-table td:nth-child(4) {
      width: 25%; /* Ajustar ancho de la columna Fecha de Creación */
    }

    .clientes-table th:nth-child(5),
    .clientes-table td:nth-child(5) {
      width: 15%; /* Ajustar ancho de la columna Acciones */
      text-align: center;
    }
  </style>

  <script src="js/menu.js"></script>
  <script src="js/cliente.js"></script>
</body>
</html>

 