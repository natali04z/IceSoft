document.addEventListener('DOMContentLoaded', async () => {
  const btnMenuList = document.querySelectorAll('.btn-menu');
  const navLateral = document.querySelector('.navLateral');

  controlMenuScroll();
  setupMenuObserver();
  restoreSubmenusState();

  btnMenuList.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); 
      e.stopPropagation();
      
      const isMenuVisible = navLateral.classList.contains('navLateral-show');
      const isMenuCollapsed = document.body.classList.contains('menu-collapsed');
      
      if (isMenuCollapsed && !isMenuVisible) {
        navLateral.classList.add('navLateral-show');
      } else if (isMenuVisible) {
        navLateral.classList.remove('navLateral-show');
      } else {
        navLateral.classList.toggle('navLateral-show');
      }
      
      document.body.classList.toggle('menu-collapsed');

      // Cerrar todos los submenús
      document.querySelectorAll('.show-submenu').forEach(submenu => submenu.classList.remove('show-submenu'));
      document.querySelectorAll('.rotate-arrow').forEach(arrow => arrow.classList.remove('rotate-arrow'));
      
      localStorage.removeItem('openSubmenus');
      setTimeout(() => controlMenuScroll(), 150);
    });
  });

  document.addEventListener('click', (e) => {
    const clickedInsideMenu = navLateral.contains(e.target);
    const clickedMenuButton = e.target.closest('.btn-menu');
    const isMenuVisible = navLateral.classList.contains('navLateral-show');
    
    if (isMenuVisible && !clickedInsideMenu && !clickedMenuButton) {
      navLateral.classList.remove('navLateral-show');
      if (window.innerWidth <= 768) {
        document.body.classList.remove('menu-collapsed');
      }
    }
  });

  navLateral.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLateral.classList.contains('navLateral-show')) {
      navLateral.classList.remove('navLateral-show');
      if (window.innerWidth <= 768) {
        document.body.classList.remove('menu-collapsed');
      }
    }
  });

  // Submenús desplegables
  const subMenuButtons = document.querySelectorAll('.btn-subMenu');
  subMenuButtons.forEach((button, index) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const subMenu = button.nextElementSibling;
      const arrow = button.querySelector('.arrow');

      subMenu.classList.toggle('show-submenu');
      if (arrow) arrow.classList.toggle('rotate-arrow');

      saveSubmenusState();
      
      // CAMBIO: Una sola llamada en lugar de múltiples
      setTimeout(() => controlMenuScroll(), 200);
    });
  });

  document.querySelectorAll('.sub-menu-options a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      saveSubmenusState();
      
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          navLateral.classList.remove('navLateral-show');
          document.body.classList.remove('menu-collapsed');
        }, 100);
      }
    });
  });

  document.querySelectorAll('.sub-menu-options').forEach(submenu => {
    submenu.addEventListener('click', (e) => {
      e.stopPropagation();
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

  const mainMenuLinks = document.querySelectorAll('.navLateral > .navLateral-body > nav > .menu-principal > li > a:not(.btn-subMenu)');
  mainMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navLateral.classList.remove('navLateral-show');
        document.body.classList.remove('menu-collapsed');
      }
    });
  });

  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      controlMenuScroll();
    }, 100);
    
    if (window.innerWidth > 768) {
      if (document.body.classList.contains('menu-collapsed')) {
        navLateral.classList.remove('navLateral-show');
      }
    }
  });

  if (window.innerWidth > 768) {
    document.body.classList.remove('menu-collapsed');
    navLateral.classList.remove('navLateral-show');
  }

  // ELIMINADO: La verificación periódica que causaba titileos
  // setInterval(() => {
  //   const hasOpenSubmenus = document.querySelectorAll('.show-submenu').length > 0;
  //   if (hasOpenSubmenus) {
  //     controlMenuScroll();
  //   }
  // }, 2000);
});

// Controlar scroll del menú
function controlMenuScroll() {
  const navLateral = document.querySelector('.navLateral');
  if (!navLateral) return;

  const navBody = navLateral.querySelector('.navLateral-body');
  if (!navBody) return;

  // Forzar recálculo de dimensiones
  navLateral.style.height = 'auto';
  navBody.style.height = 'auto';
  
  navLateral.offsetHeight;
  navBody.offsetHeight;

  requestAnimationFrame(() => {
    const menuHeight = navLateral.clientHeight;
    const contentHeight = navBody.scrollHeight;
    
    const needsScroll = contentHeight > (menuHeight + 10);
    
    if (needsScroll) {
      navLateral.style.overflowY = 'auto';
      navLateral.classList.add('has-scroll');
      navLateral.style.maxHeight = '100vh';
      navLateral.style.height = '100vh';
    } else {
      navLateral.style.overflowY = 'hidden';
      navLateral.classList.remove('has-scroll');
      navLateral.style.maxHeight = '';
      navLateral.style.height = '';
    }
    
    // ELIMINADO: La verificación adicional que causaba titileos
    // setTimeout(() => {
    //   const finalMenuHeight = navLateral.clientHeight;
    //   const finalContentHeight = navBody.scrollHeight;
    //   
    //   if (finalContentHeight > finalMenuHeight && navLateral.style.overflowY !== 'auto') {
    //     navLateral.style.overflowY = 'auto';
    //     navLateral.classList.add('has-scroll');
    //     navLateral.style.maxHeight = '100vh';
    //     navLateral.style.height = '100vh';
    //   }
    // }, 100);
  });
}

// Observer para detectar cambios en el menú
function setupMenuObserver() {
  const navLateral = document.querySelector('.navLateral');
  if (!navLateral) return;

  const observer = new MutationObserver((mutations) => {
    let shouldUpdateScroll = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        shouldUpdateScroll = true;
      }
      if (mutation.type === 'childList') {
        shouldUpdateScroll = true;
      }
    });
    
    if (shouldUpdateScroll) {
      setTimeout(() => controlMenuScroll(), 350);
    }
  });

  observer.observe(navLateral, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
}

// Scroll al elemento activo
function scrollToActiveMenuItem() {
  const activeItem = document.querySelector('.navLateral .active');
  const navLateral = document.querySelector('.navLateral');
  
  if (activeItem && navLateral) {
    controlMenuScroll();
    
    setTimeout(() => {
      activeItem.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  }
}

// Guardar estado de submenús
function saveSubmenusState() {
  const openSubmenus = [];
  
  document.querySelectorAll('.sub-menu-options').forEach((submenu, index) => {
    if (submenu.classList.contains('show-submenu')) {
      const button = submenu.previousElementSibling;
      const submenuText = button.querySelector('span').textContent.trim();
      openSubmenus.push(submenuText);
    }
  });
  
  localStorage.setItem('openSubmenus', JSON.stringify(openSubmenus));
}

// Restaurar estado de submenús
function restoreSubmenusState() {
  const savedState = localStorage.getItem('openSubmenus');
  
  if (savedState) {
    const openSubmenus = JSON.parse(savedState);
    
    document.querySelectorAll('.btn-subMenu').forEach(button => {
      const submenuText = button.querySelector('span').textContent.trim();
      
      if (openSubmenus.includes(submenuText)) {
        const subMenu = button.nextElementSibling;
        const arrow = button.querySelector('.arrow');
        
        subMenu.classList.add('show-submenu');
        if (arrow) arrow.classList.add('rotate-arrow');
      }
    });
    
    // CAMBIO: Una sola llamada en lugar de múltiples
    setTimeout(() => controlMenuScroll(), 400);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}