// userHeaderIntegrated.js - SIN botón de menú (para evitar duplicados)

class UserHeaderIntegrated {
    constructor(containerId = 'userProfileSection') {
        this.container = document.getElementById(containerId);
        this.userInfo = {
            name: '',
            lastname: '',
            contact_number: '',
            email: '',
            role: '',
            status: 'inactive'
        };
        
        // URLs de la API
        this.API_BASE_URL = "https://backend-yy4o.onrender.com/api";
        this.API_PROFILE = `${this.API_BASE_URL}/users/profile/me`;
        
        this.init();
    }

    async init() {
        this.render();
        this.bindEvents();
        await this.loadUserProfile();
    }

    // Renderizar SOLO el perfil de usuario (SIN botón de menú)
    render() {
        this.container.innerHTML = `
            <div class="uhi-user-dropdown-container">
                <div class="uhi-user-info" id="userDropdownToggle">
                    <div class="uhi-user-avatar" id="userAvatar">U</div>
                    <div class="uhi-user-details">
                        <span class="uhi-user-name" id="loggedUserName">Cargando...</span>
                        <span class="uhi-user-role" id="userRoleBadge">-</span>
                    </div>
                     <i class="material-icons uhi-arrow-icon" id="arrowIcon">expand_more</i>
                </div>
                
                <div class="uhi-user-dropdown-menu" id="userDropdownMenu">
                    <!-- Información del Usuario -->
                    <div class="uhi-user-profile-section">
                        <div class="uhi-user-profile-header">
                            <div class="uhi-user-avatar-large" id="dropdownAvatar">U</div>
                            <div class="uhi-user-profile-info">
                                <h3 id="dropdownUserName">Cargando...</h3>
                                <div class="uhi-user-badges">
                                    <span class="uhi-badge uhi-badge-role" id="dropdownUserRole">-</span>
                                    <span class="uhi-badge uhi-badge-status" id="dropdownUserStatus">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Detalles del Usuario -->
                    <div class="uhi-user-details-section">
                        <div class="uhi-detail-item">
                            <i class="material-icons">phone</i>
                            <div>
                                <span class="uhi-detail-label">Teléfono</span>
                                <span class="uhi-detail-value" id="dropdownUserPhone">-</span>
                            </div>
                        </div>
                        <div class="uhi-detail-item">
                            <i class="material-icons">email</i>
                            <div>
                                <span class="uhi-detail-label">Correo</span>
                                <span class="uhi-detail-value" id="dropdownUserEmail">-</span>
                            </div>
                        </div>
                        <div class="uhi-detail-item">
                            <i class="material-icons">check_circle</i>
                            <div>
                                <span class="uhi-detail-label">Estado</span>
                                <span class="uhi-detail-value" id="dropdownUserStatusText">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="uhi-dropdown-divider"></div>
                    
                    <a href="#" class="uhi-dropdown-item" onclick="logout()">
                        <i class="material-icons">logout</i>
                        <span>Cerrar Sesión</span>
                    </a>
                </div>
            </div>
        `;
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "login.html";
                return;
            }
            
            const res = await fetch(this.API_PROFILE, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });
            
            const data = await res.json();
            
            if (res.ok) {
                this.userInfo = data;
                this.updateUserInterface();
                this.saveUserDataToLocalStorage(data);
            } else {
                this.showError(data.message || "Error al cargar el perfil de usuario.");
            }
        } catch (err) {
            this.showError("Error al cargar el perfil: " + (err.message || err));
        }
    }

    bindEvents() {
        const dropdownToggle = document.getElementById('userDropdownToggle');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        const arrowIcon = document.getElementById('arrowIcon');

        // Toggle dropdown
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdownMenu.classList.contains('uhi-show');
            
            if (isOpen) {
                this.closeDropdown();
            } else {
                // MODIFICACIÓN: Cerrar dropdown de notificaciones antes de abrir usuario
                const notificationDropdown = document.getElementById('notificationDropdown');
                if (notificationDropdown) {
                    notificationDropdown.classList.remove('show');
                }
                
                this.openDropdown();
            }
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
    }

    openDropdown() {
        document.getElementById('userDropdownMenu').classList.add('uhi-show');
        document.getElementById('arrowIcon').style.transform = 'rotate(180deg)';
    }

    closeDropdown() {
        document.getElementById('userDropdownMenu').classList.remove('uhi-show');
        document.getElementById('arrowIcon').style.transform = 'rotate(0deg)';
    }

    updateUserInterface() {
        const userDisplay = this.getUserDisplayInfo();

        // Actualizar elementos del header
        document.getElementById('userAvatar').textContent = userDisplay.initials;
        document.getElementById('loggedUserName').textContent = userDisplay.fullName;
        document.getElementById('userRoleBadge').textContent = userDisplay.roleName;
        
        // Actualizar elementos del dropdown
        document.getElementById('dropdownAvatar').textContent = userDisplay.initials;
        document.getElementById('dropdownUserName').textContent = userDisplay.fullName;
        document.getElementById('dropdownUserRole').textContent = userDisplay.roleName;
        document.getElementById('dropdownUserStatus').textContent = userDisplay.statusText;
        document.getElementById('dropdownUserPhone').textContent = this.userInfo.contact_number || 'No disponible';
        document.getElementById('dropdownUserEmail').textContent = this.userInfo.email || 'No disponible';
        document.getElementById('dropdownUserStatusText').textContent = userDisplay.statusText;

        // Actualizar clases de badges
        const roleBadge = document.getElementById('dropdownUserRole');
        const statusBadge = document.getElementById('dropdownUserStatus');
        
        roleBadge.className = `uhi-badge uhi-badge-role ${userDisplay.roleClass}`;
        statusBadge.className = `uhi-badge uhi-badge-status ${userDisplay.statusClass}`;
    }

    getUserDisplayInfo() {
        const name = this.userInfo.name || '';
        const lastname = this.userInfo.lastname || '';
        const initials = (name.charAt(0) + lastname.charAt(0)).toUpperCase() || 'U';
        const fullName = `${name} ${lastname}`.trim() || 'Usuario';
        const roleName = this.getRoleName();
        const statusText = this.userInfo.status === "active" ? "Activo" : "Inactivo";
        const roleClass = this.getRoleClass(roleName);
        const statusClass = this.userInfo.status === 'active' ? 'uhi-status-active' : 'uhi-status-inactive';

        return {
            initials,
            fullName,
            roleName,
            statusText,
            roleClass,
            statusClass
        };
    }

    getRoleName() {
        if (!this.userInfo.role) return 'No asignado';
        
        if (typeof this.userInfo.role === 'string') {
            return this.userInfo.role;
        } else if (this.userInfo.role.displayName) {
            return this.userInfo.role.displayName;
        } else if (this.userInfo.role.name) {
            return this.userInfo.role.name;
        }
        
        return 'No asignado';
    }

    getRoleClass(roleName) {
        const role = roleName.toLowerCase();
        if (role.includes('admin')) return 'uhi-role-admin';
        if (role.includes('editor')) return 'uhi-role-editor';
        if (role.includes('moderator')) return 'uhi-role-moderator';
        return 'uhi-role-user';
    }

    saveUserDataToLocalStorage(profile) {
        if (!profile) return;
        
        const userData = {
            name: profile.name || '',
            lastname: profile.lastname || '',
            email: profile.email || '',
            contact_number: profile.contact_number || '',
            role: this.getRoleName(),
            status: profile.status || 'inactive'
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
    }

    showError(message) {
        if (typeof showError === 'function') {
            showError(message);
        } else {
            console.error(message);
        }
    }

    getUserInfo() {
        return { ...this.userInfo };
    }

    async refreshUserData() {
        await this.loadUserProfile();
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "index.html";
}

let userHeaderInstance = null;