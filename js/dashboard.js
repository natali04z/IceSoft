// Dashboard Manager - Sistema completo para ICESOFT
class DashboardManager {
    constructor() {
        this.data = {
            sales: {
                thisMonth: 24500,
                transactions: 42,
                growth: 18
            },
            purchases: {
                thisMonth: 18320,
                orders: 28,
                reduction: 5
            },
            activities: []
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Inicializando Dashboard ICESOFT...');
        this.loadMockData();
        this.setupEventListeners();
        this.startAnimations();
        this.setupTooltips();
        this.startAutoRefresh();
        console.log('✅ Dashboard inicializado correctamente');
    }

    loadMockData() {
        this.data.activities = [
            {
                id: 1,
                icon: '💰',
                title: 'Nueva venta registrada - Cliente: Empresa ABC',
                time: new Date(Date.now() - 10 * 60000),
                type: 'sale',
                amount: 2500
            },
            {
                id: 2,
                icon: '🛒',
                title: 'Compra realizada - Proveedor: Suministros XYZ',
                time: new Date(Date.now() - 2 * 3600000),
                type: 'purchase',
                amount: 1800
            },
            {
                id: 3,
                icon: '👤',
                title: 'Nuevo cliente registrado - Empresa DEF',
                time: new Date(Date.now() - 5 * 3600000),
                type: 'customer'
            },
            {
                id: 4,
                icon: '📋',
                title: 'Actualización de inventario - 15 productos',
                time: new Date(Date.now() - 24 * 3600000),
                type: 'inventory'
            }
        ];
    }

    startAnimations() {
        setTimeout(() => this.animateNumbers(), 500);
        setTimeout(() => this.animateCharts(), 1000);
        setTimeout(() => this.animateActivities(), 1500);
    }

    animateNumbers() {
        this.animateValue('.widget:first-child .stat-item:nth-child(1) .stat-value', 0, this.data.sales.thisMonth, '$');
        this.animateValue('.widget:first-child .stat-item:nth-child(2) .stat-value', 0, this.data.sales.transactions);
        this.animateValue('.widget:first-child .stat-item:nth-child(3) .stat-value', 0, this.data.sales.growth, '', '%');
        
        setTimeout(() => {
            this.animateValue('.widget:nth-child(2) .stat-item:nth-child(1) .stat-value', 0, this.data.purchases.thisMonth, '$');
            this.animateValue('.widget:nth-child(2) .stat-item:nth-child(2) .stat-value', 0, this.data.purchases.orders);
            this.animateValue('.widget:nth-child(2) .stat-item:nth-child(3) .stat-value', 0, this.data.purchases.reduction, '', '%');
        }, 400);
    }

    animateValue(selector, start, end, prefix = '', suffix = '') {
        const element = document.querySelector(selector);
        if (!element) return;

        let current = start;
        const increment = (end - start) / 60;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
        }, 25);
    }

    animateCharts() {
        // Animar línea de ventas
        const polyline = document.querySelector('.widget:first-child polyline');
        if (polyline) {
            const length = polyline.getTotalLength();
            polyline.style.strokeDasharray = length;
            polyline.style.strokeDashoffset = length;
            polyline.style.transition = 'stroke-dashoffset 2.5s ease-in-out';
            
            setTimeout(() => {
                polyline.style.strokeDashoffset = '0';
            }, 200);
        }

        // Animar área bajo la curva
        const path = document.querySelector('.widget:first-child path');
        if (path) {
            path.style.opacity = '0';
            path.style.transition = 'opacity 1.5s ease-in-out';
            setTimeout(() => {
                path.style.opacity = '0.3';
            }, 1000);
        }

        // Animar barras de compras
        const bars = document.querySelectorAll('.widget:nth-child(2) rect');
        bars.forEach((bar, index) => {
            const originalHeight = bar.getAttribute('height');
            const originalY = bar.getAttribute('y');
            
            bar.setAttribute('height', '0');
            bar.setAttribute('y', '120');
            bar.style.transition = 'all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            setTimeout(() => {
                bar.setAttribute('height', originalHeight);
                bar.setAttribute('y', originalY);
            }, index * 120 + 500);
        });
    }

    animateActivities() {
        const activities = document.querySelectorAll('.activity-item');
        activities.forEach((activity, index) => {
            activity.style.opacity = '0';
            activity.style.transform = 'translateX(-30px)';
            activity.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            
            setTimeout(() => {
                activity.style.opacity = '1';
                activity.style.transform = 'translateX(0)';
            }, index * 150);
        });
    }

    setupEventListeners() {
        // Hover effects para widgets
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach((widget, index) => {
            widget.addEventListener('click', () => {
                const title = widget.querySelector('.widget-title').textContent;
                if (title.includes('Ventas')) {
                    console.log('📊 Navegando a gestión de ventas...');
                    this.showNotification('Navegando...', 'Redirigiendo a gestión de ventas');
                } else if (title.includes('Compras')) {
                    console.log('🛒 Navegando a gestión de compras...');
                    this.showNotification('Navegando...', 'Redirigiendo a gestión de compras');
                }
            });
        });

        // Click en actividades
        const activities = document.querySelectorAll('.activity-item');
        activities.forEach((activity, index) => {
            activity.addEventListener('click', () => {
                const title = activity.querySelector('.activity-title').textContent;
                console.log('📋 Actividad seleccionada:', title);
                this.showNotification('Actividad', title);
            });
        });
    }

    setupTooltips() {
        // Tooltips para gráfico de ventas
        const salesChart = document.querySelector('.widget:first-child svg');
        if (salesChart) {
            salesChart.addEventListener('mouseenter', (e) => {
                this.showTooltip(e, 'Tendencia de Ventas', `Crecimiento mensual: +${this.data.sales.growth}%`);
            });
            salesChart.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        }

        // Tooltips para gráfico de compras
        const purchaseBars = document.querySelectorAll('.widget:nth-child(2) rect');
        purchaseBars.forEach((bar, index) => {
            bar.addEventListener('mouseenter', (e) => {
                const values = [15000, 16500, 14800, 17200, 15800, 18320];
                this.showTooltip(e, `Mes ${index + 1}`, `${(values[index] || 0).toLocaleString()}`);
            });
            bar.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(event, title, content) {
        let tooltip = document.getElementById('dashboard-tooltip');
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'dashboard-tooltip';
            tooltip.className = 'dashboard-tooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
            <div>${content}</div>
        `;
        
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY - 50 + 'px';
        tooltip.style.opacity = '1';
    }

    hideTooltip() {
        const tooltip = document.getElementById('dashboard-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    }

    showNotification(title, message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
            <div style="font-size: 14px; opacity: 0.9;">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    startAutoRefresh() {
        // Actualizar datos cada 2 minutos
        setInterval(() => {
            this.refreshData();
        }, 120000);
    }

    refreshData() {
        console.log('🔄 Refrescando datos...');
        
        // Simular pequeños cambios en los datos
        this.data.sales.thisMonth += Math.floor(Math.random() * 500) + 100;
        this.data.sales.transactions += Math.floor(Math.random() * 3) + 1;
        
        // Actualizar UI
        this.updateElement('.widget:first-child .stat-item:nth-child(1) .stat-value', 
                          `${this.data.sales.thisMonth.toLocaleString()}`);
        this.updateElement('.widget:first-child .stat-item:nth-child(2) .stat-value', 
                          this.data.sales.transactions.toString());
        
        // Efecto visual de actualización
        const salesWidget = document.querySelector('.widget:first-child');
        if (salesWidget) {
            salesWidget.classList.add('data-updated');
            setTimeout(() => salesWidget.classList.remove('data-updated'), 2000);
        }
        
        console.log('✅ Datos actualizados');
    }

    updateElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    // API pública
    async addSale(amount, client) {
        console.log(`💰 Agregando nueva venta: ${amount} - ${client}`);
        
        this.data.sales.thisMonth += amount;
        this.data.sales.transactions += 1;
        
        // Agregar nueva actividad
        this.data.activities.unshift({
            id: Date.now(),
            icon: '💰',
            title: `Nueva venta registrada - Cliente: ${client}`,
            time: new Date(),
            type: 'sale',
            amount: amount
        });
        
        // Actualizar UI
        this.updateElement('.widget:first-child .stat-item:nth-child(1) .stat-value', 
                          `${this.data.sales.thisMonth.toLocaleString()}`);
        this.updateElement('.widget:first-child .stat-item:nth-child(2) .stat-value', 
                          this.data.sales.transactions.toString());
        
        // Actualizar actividades
        this.refreshActivities();
        
        // Mostrar notificación
        this.showNotification('Venta Registrada', `${amount.toLocaleString()} - ${client}`);
        
        console.log(`✅ Venta agregada exitosamente`);
    }

    async addPurchase(amount, provider) {
        console.log(`🛒 Agregando nueva compra: ${amount} - ${provider}`);
        
        this.data.purchases.thisMonth += amount;
        this.data.purchases.orders += 1;
        
        // Agregar nueva actividad
        this.data.activities.unshift({
            id: Date.now(),
            icon: '🛒',
            title: `Compra realizada - Proveedor: ${provider}`,
            time: new Date(),
            type: 'purchase',
            amount: amount
        });
        
        // Actualizar UI
        this.updateElement('.widget:nth-child(2) .stat-item:nth-child(1) .stat-value', 
                          `${this.data.purchases.thisMonth.toLocaleString()}`);
        this.updateElement('.widget:nth-child(2) .stat-item:nth-child(2) .stat-value', 
                          this.data.purchases.orders.toString());
        
        // Actualizar actividades
        this.refreshActivities();
        
        // Mostrar notificación
        this.showNotification('Compra Registrada', `${amount.toLocaleString()} - ${provider}`);
        
        console.log(`✅ Compra agregada exitosamente`);
    }

    refreshActivities() {
        const activityContainer = document.querySelector('.recent-activity');
        if (!activityContainer) return;

        // Remover actividades existentes
        const existingItems = activityContainer.querySelectorAll('.activity-item');
        existingItems.forEach(item => item.remove());

        // Agregar nuevas actividades (máximo 4)
        this.data.activities.slice(0, 4).forEach((activity, index) => {
            const activityElement = this.createActivityElement(activity);
            activityContainer.appendChild(activityElement);
        });

        // Re-aplicar animaciones
        setTimeout(() => this.animateActivities(), 100);
    }

    createActivityElement(activity) {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'activity-item';
        
        const statusClasses = {
            'sale': 'status-success',
            'purchase': 'status-warning',
            'customer': 'status-info',
            'inventory': 'status-success'
        };
        
        activityDiv.innerHTML = `
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-details">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${this.formatRelativeTime(activity.time)}</div>
            </div>
            <div class="status-indicator ${statusClasses[activity.type] || 'status-info'}"></div>
        `;

        // Agregar event listener
        activityDiv.addEventListener('click', () => {
            console.log('📋 Actividad seleccionada:', activity.title);
            this.showNotification('Actividad', activity.title);
        });

        return activityDiv;
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return 'Hace unos momentos';
    }

    getData() {
        return {
            sales: this.data.sales,
            purchases: this.data.purchases,
            activities: this.data.activities,
            lastUpdate: new Date()
        };
    }
}

// Inicialización global
let dashboardManager = null;

document.addEventListener('DOMContentLoaded', function() {
    dashboardManager = new DashboardManager();
    
    // API global
    window.dashboard = {
        addSale: async (amount, client) => {
            if (dashboardManager && amount > 0 && client) {
                await dashboardManager.addSale(amount, client);
            } else {
                console.error('❌ Parámetros inválidos para addSale');
            }
        },
        
        addPurchase: async (amount, provider) => {
            if (dashboardManager && amount > 0 && provider) {
                await dashboardManager.addPurchase(amount, provider);
            } else {
                console.error('❌ Parámetros inválidos para addPurchase');
            }
        },
        
        refresh: () => {
            if (dashboardManager) {
                dashboardManager.refreshData();
            }
        },
        
        getData: () => {
            return dashboardManager ? dashboardManager.getData() : null;
        }
    };

    // Utilidades adicionales
    window.dashboardUtils = {
        addTestData: async () => {
            const clients = ['Empresa ABC', 'Corporación XYZ', 'Industrias DEF'];
            const providers = ['Suministros XYZ', 'Proveedores ABC', 'Distribuidora DEF'];
            
            console.log('🧪 Agregando datos de prueba...');
            
            // Agregar 2 ventas de prueba
            for (let i = 0; i < 2; i++) {
                const amount = Math.floor(Math.random() * 3000) + 1000;
                const client = clients[Math.floor(Math.random() * clients.length)];
                await dashboard.addSale(amount, client);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Agregar 1 compra de prueba
            const amount = Math.floor(Math.random() * 2000) + 500;
            const provider = providers[Math.floor(Math.random() * providers.length)];
            await dashboard.addPurchase(amount, provider);
            
            console.log('✅ Datos de prueba agregados');
        },
        
        showStats: () => {
            const data = dashboard.getData();
            if (data) {
                console.log('📊 ESTADÍSTICAS DEL DASHBOARD:');
                console.log('================================');
                console.log(`💰 Ventas: ${data.sales.thisMonth.toLocaleString()}`);
                console.log(`🛒 Compras: ${data.purchases.thisMonth.toLocaleString()}`);
                console.log(`📈 Ganancia: ${(data.sales.thisMonth - data.purchases.thisMonth).toLocaleString()}`);
                console.log(`📋 Transacciones: ${data.sales.transactions}`);
                console.log(`📦 Órdenes: ${data.purchases.orders}`);
                console.log(`🎯 Actividades: ${data.activities.length}`);
            }
        },
        
        exportData: () => {
            const data = dashboard.getData();
            if (data) {
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `dashboard_data_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('📥 Datos exportados exitosamente');
            }
        }
    };
    
    // Información de la API
    console.log('🎉 Dashboard ICESOFT cargado exitosamente!');
    console.log('📚 API disponible:');
    console.log('   • dashboard.addSale(amount, client)');
    console.log('   • dashboard.addPurchase(amount, provider)');
    console.log('   • dashboard.refresh()');
    console.log('   • dashboard.getData()');
    console.log('   • dashboardUtils.addTestData()');
    console.log('   • dashboardUtils.showStats()');
    console.log('   • dashboardUtils.exportData()');
    console.log('');
    console.log('💡 Ejemplo: await dashboard.addSale(2500, "Empresa ABC");');
});

// Teclas de acceso rápido
document.addEventListener('keydown', (event) => {
    // Ctrl + Alt + T: Agregar datos de prueba
    if (event.ctrlKey && event.altKey && event.key === 't') {
        event.preventDefault();
        dashboardUtils.addTestData();
    }
    
    // Ctrl + Alt + S: Mostrar estadísticas
    if (event.ctrlKey && event.altKey && event.key === 's') {
        event.preventDefault();
        dashboardUtils.showStats();
    }
    
    // Ctrl + Alt + R: Refrescar
    if (event.ctrlKey && event.altKey && event.key === 'r') {
        event.preventDefault();
        dashboard.refresh();
    }
});