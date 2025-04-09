document.addEventListener('DOMContentLoaded', async () => {
  // Mostrar/Ocultar menú lateral
  const btnMenuList = document.querySelectorAll('.btn-menu');
  const navLateral = document.querySelector('.navLateral');

  btnMenuList.forEach(btn => {
    btn.addEventListener('click', () => {
      navLateral.classList.toggle('navLateral-show');
      document.body.classList.toggle('menu-collapsed');

      document.querySelectorAll('.show-submenu').forEach(submenu => submenu.classList.remove('show-submenu'));
      document.querySelectorAll('.rotate-arrow').forEach(arrow => arrow.classList.remove('rotate-arrow'));
    });
  });

  // Submenús desplegables
  const subMenuButtons = document.querySelectorAll('.btn-subMenu');
  subMenuButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const subMenu = button.nextElementSibling;
      const arrow = button.querySelector('.arrow');

      document.querySelectorAll('.show-submenu').forEach(menu => {
        if (menu !== subMenu) menu.classList.remove('show-submenu');
      });

      document.querySelectorAll('.rotate-arrow').forEach(otherArrow => {
        if (otherArrow !== arrow) otherArrow.classList.remove('rotate-arrow');
      });

      subMenu.classList.toggle('show-submenu');
      if (arrow) arrow.classList.toggle('rotate-arrow');
    });
  });

  // Control de visibilidad del menú según el rol
  const role = localStorage.getItem("userRole");
  const menuUsuarios = document.getElementById("menuUsuarios");
  const menuCompras = document.getElementById("menuCompras");
  const menuVentas = document.getElementById("menuVentas");
  const menuComprasDivider = document.getElementById("menuComprasDivider");
  const menuVentasDivider = document.getElementById("menuVentasDivider");

  if (role === "assistant") {
    if (menuUsuarios) menuUsuarios.style.display = "none";
  } else if (role === "employee") {
    if (menuUsuarios) menuUsuarios.style.display = "none";
    if (menuCompras) menuCompras.style.display = "none";
    if (menuVentas) menuVentas.style.display = "none";
    if (menuComprasDivider) menuComprasDivider.style.display = "none";
    if (menuVentasDivider) menuVentasDivider.style.display = "none";
  }

  // Mostrar nombre del usuario logueado
  const token = localStorage.getItem("token");

if (token) {
  try {
    const res = await fetch("https://backend-icesoft.onrender.com/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.ok) {
      const user = await res.json();
      const nameElement = document.getElementById("loggedUserName");
      if (nameElement) {
        nameElement.textContent = `${user.name}`;
      }
    } else {
      console.warn("No autorizado o error en respuesta del backend");
    }
  } catch (error) {
    console.error("Error al obtener usuario:", error);
  }
}


  // Dropdown del usuario
  const userInfo = document.querySelector('.user-info');
  const userDropdownMenu = document.getElementById('userDropdownMenu');

  if (userInfo && userDropdownMenu) {
    userInfo.addEventListener('click', () => {
      const isVisible = userDropdownMenu.style.display === 'block';
      userDropdownMenu.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!userInfo.contains(e.target) && !userDropdownMenu.contains(e.target)) {
        userDropdownMenu.style.display = 'none';
      }
    });
  }
});

// Cerrar sesión
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}