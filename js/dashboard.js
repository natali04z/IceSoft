// APIs para el dashboard
const API_SALES = "https://backend-alpha-orpin-58.vercel.app/api/sales";
const API_PURCHASES = "https://backend-alpha-orpin-58.vercel.app/api/purchases";
const API_CUSTOMERS = "https://backend-alpha-orpin-58.vercel.app/api/customers";
const API_PRODUCTS = "https://backend-alpha-orpin-58.vercel.app/api/products";

// Variables globales para el dashboard
let dashboardData = {
    sales: {
        totalThisMonth: 0,
        transactionsThisMonth: 0,
        growthPercentage: 0,
        recentSales: []
    },
    purchases: {
        totalThisMonth: 0,
        ordersThisMonth: 0,
        reductionPercentage: 0,
        recentPurchases: []
    },
    customers: {
        total: 0,
        newThisMonth: 0,
        recentCustomers: []
    },
    products: {
        total: 0,
        lowStock: 0,
        recentProducts: []
    }
};

// ===== FUNCIONES HELPER =====

/**
 * Formatea una cantidad monetaria
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Formatea fecha para mostrar al usuario
 */
function formatDateForDisplay(date) {
    if (!date) return "Fecha no disponible";
    
    try {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            return dateObj.toLocaleDateString('es-CO');
        }
        
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString('es-CO');
    } catch (e) {
        return date.toString();
    }
}

/**
 * Calcula el tiempo transcurrido desde una fecha
 */
function getTimeAgo(dateString) {
    if (!dateString) {
        return '-';
    }
    
    try {
        const date = new Date(dateString);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return '-';
        }
        
        const now = new Date();
        const diffInMs = now - date;
        
        // Si la fecha es futura, retornar mensaje apropiado
        if (diffInMs < 0) {
            return 'Fecha futura';
        }
        
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInMonths = Math.floor(diffInDays / 30);
        const diffInYears = Math.floor(diffInDays / 365);

        if (diffInMinutes < 1) {
            return 'Hace un momento';
        } else if (diffInMinutes < 60) {
            return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
        } else if (diffInHours < 24) {
            return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
        } else if (diffInDays < 30) {
            return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
        } else if (diffInMonths < 12) {
            return `Hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`;
        } else {
            return `Hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`;
        }
    } catch (error) {
        return '-';
    }
}

/**
 * Obtiene el primer día del mes actual
 */
function getFirstDayOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Obtiene el primer día del mes anterior
 */
function getFirstDayOfPreviousMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

// ===== FUNCIONES DE CARGA DE DATOS =====

/**
 * Carga datos de ventas del mes actual
 */
async function loadSalesData() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(API_SALES, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar ventas');
        }
        
        let data = await response.json();
        
        // Manejar diferentes estructuras de respuesta como en el archivo original
        let sales = [];
        if (data && typeof data === 'object' && data.sales) {
            sales = data.sales;
        } 
        else if (Array.isArray(data)) {
            sales = data;
        }
        else if (data && typeof data === 'object') {
            const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (arrayProps.length > 0) {
                sales = data[arrayProps[0]];
            } else {
                sales = [];
            }
        }
        
        if (!Array.isArray(sales)) {
            sales = [];
        }
        
        // Normalizar las ventas como en el archivo original
        sales = sales.map(sale => {
            let adaptedSale = {...sale};
            
            if (!adaptedSale || typeof adaptedSale !== 'object') {
                return {};
            }
            
            // Normalizar status
            if (adaptedSale.status === undefined && adaptedSale.estado !== undefined) {
                adaptedSale.status = adaptedSale.estado;
            } else if (adaptedSale.estado === undefined && adaptedSale.status !== undefined) {
                adaptedSale.estado = adaptedSale.status;
            }
            
            // Normalizar fechas - más completo
            if (adaptedSale.saleDate === undefined) {
                if (adaptedSale.sales_date !== undefined) {
                    adaptedSale.saleDate = adaptedSale.sales_date;
                } else if (adaptedSale.fecha_venta !== undefined) {
                    adaptedSale.saleDate = adaptedSale.fecha_venta;
                } else if (adaptedSale.salesDate !== undefined) {
                    adaptedSale.saleDate = adaptedSale.salesDate;
                }
            }
            
            // También normalizar en el otro sentido
            if (adaptedSale.sales_date === undefined && adaptedSale.saleDate !== undefined) {
                adaptedSale.sales_date = adaptedSale.saleDate;
            }
            if (adaptedSale.fecha_venta === undefined && adaptedSale.saleDate !== undefined) {
                adaptedSale.fecha_venta = adaptedSale.saleDate;
            }
            
            // Normalizar monto total - más completo
            if (adaptedSale.totalAmount === undefined) {
                if (adaptedSale.total !== undefined) {
                    adaptedSale.totalAmount = adaptedSale.total;
                } else if (adaptedSale.total_amount !== undefined) {
                    adaptedSale.totalAmount = adaptedSale.total_amount;
                } else if (adaptedSale.totalamount !== undefined) {
                    adaptedSale.totalAmount = adaptedSale.totalamount;
                }
            }
            
            // Normalizar nombre del cliente - más completo
            if (adaptedSale.customerName === undefined) {
                if (adaptedSale.customer && adaptedSale.customer.name) {
                    adaptedSale.customerName = adaptedSale.customer.name;
                } else if (adaptedSale.customer && adaptedSale.customer.companyName) {
                    adaptedSale.customerName = adaptedSale.customer.companyName;
                } else if (adaptedSale.cliente && adaptedSale.cliente.name) {
                    adaptedSale.customerName = adaptedSale.cliente.name;
                } else if (adaptedSale.cliente && adaptedSale.cliente.companyName) {
                    adaptedSale.customerName = adaptedSale.cliente.companyName;
                } else if (adaptedSale.customer_name !== undefined) {
                    adaptedSale.customerName = adaptedSale.customer_name;
                } else if (adaptedSale.nombre_cliente !== undefined) {
                    adaptedSale.customerName = adaptedSale.nombre_cliente;
                }
            }
            
            // Normalizar productos si existen
            if (adaptedSale.products === undefined && adaptedSale.productos !== undefined) {
                adaptedSale.products = adaptedSale.productos.map(item => ({
                    product: item.producto,
                    quantity: item.cantidad,
                    sale_price: item.precio_venta,
                    total: item.total
                }));
            } else if (adaptedSale.productos === undefined && adaptedSale.products !== undefined) {
                adaptedSale.productos = adaptedSale.products.map(item => ({
                    producto: item.product,
                    cantidad: item.quantity,
                    precio_venta: item.sale_price,
                    total: item.total
                }));
            }
            
            // Normalizar customer
            if (adaptedSale.customer === undefined && adaptedSale.cliente !== undefined) {
                adaptedSale.customer = adaptedSale.cliente;
            } else if (adaptedSale.cliente === undefined && adaptedSale.customer !== undefined) {
                adaptedSale.cliente = adaptedSale.customer;
            }
            
            // Establecer status por defecto si no existe
            if (adaptedSale.status === undefined && adaptedSale.estado === undefined) {
                adaptedSale.status = "processing";
                adaptedSale.estado = "processing";
            }
            
            // Convertir pending a processing
            if (adaptedSale.status === "pending") {
                adaptedSale.status = "processing";
                adaptedSale.estado = "processing";
            }
            
            return adaptedSale;
        }).filter(sale => sale && typeof sale === 'object' && Object.keys(sale).length > 0);
        
        const currentMonth = getFirstDayOfMonth();
        const previousMonth = getFirstDayOfPreviousMonth();
        
        // Filtrar ventas del mes actual - acepta más estados
        const currentMonthSales = sales.filter(sale => {
            if (!sale.saleDate) return false;
            const saleDate = new Date(sale.saleDate);
            return saleDate >= currentMonth && (
                sale.status === 'completed' || 
                sale.status === 'active' || 
                sale.status === 'processing' ||
                sale.estado === 'completed' || 
                sale.estado === 'active' || 
                sale.estado === 'processing'
            );
        });
        
        // Filtrar ventas del mes anterior
        const previousMonthSales = sales.filter(sale => {
            if (!sale.saleDate) return false;
            const saleDate = new Date(sale.saleDate);
            return saleDate >= previousMonth && saleDate < currentMonth && (
                sale.status === 'completed' || 
                sale.status === 'active' || 
                sale.status === 'processing' ||
                sale.estado === 'completed' || 
                sale.estado === 'active' || 
                sale.estado === 'processing'
            );
        });
        
        // Calcular totales
        const currentMonthTotal = currentMonthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        const previousMonthTotal = previousMonthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        
        // Obtener ventas más recientes basándose en ID (últimas agregadas tienen ID más alto)
        const recentSales = sales
            .filter(sale => 
                sale.status === 'completed' || 
                sale.status === 'active' || 
                sale.status === 'processing' ||
                sale.estado === 'completed' || 
                sale.estado === 'active' || 
                sale.estado === 'processing'
            )
            .sort((a, b) => {
                // Ordenar por ID descendente para obtener las últimas agregadas
                const idA = parseInt(a.id?.replace(/\D/g, '') || a._id || '0');
                const idB = parseInt(b.id?.replace(/\D/g, '') || b._id || '0');
                return idB - idA;
            })
            .slice(0, 5);
        
        // Obtener datos para gráfica (últimos 6 meses)
        const chartData = getSalesChartData(sales);

        dashboardData.sales = {
            totalThisMonth: currentMonthTotal,
            transactionsThisMonth: currentMonthSales.length,
            recentSales: recentSales,
            chartData: chartData
        };
        
    } catch (error) {
        dashboardData.sales = {
            totalThisMonth: 0,
            transactionsThisMonth: 0,
            recentSales: [],
            chartData: []
        };
    }
}

/**
 * Carga datos de compras del mes actual
 */
async function loadPurchasesData() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(API_PURCHASES, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar compras');
        }
        
        let data = await response.json();
        
        // Manejar diferentes estructuras de respuesta como en el archivo original
        let purchases = [];
        if (data && typeof data === 'object' && data.purchases) {
            purchases = data.purchases;
        } 
        else if (Array.isArray(data)) {
            purchases = data;
        }
        else if (data && typeof data === 'object') {
            const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (arrayProps.length > 0) {
                purchases = data[arrayProps[0]];
            } else {
                purchases = [];
            }
        }
        
        if (!Array.isArray(purchases)) {
            purchases = [];
        }
        
        // Normalizar las compras como en el archivo original
        purchases = purchases.map(purchase => {
            let adaptedPurchase = {...purchase};
            
            if (!adaptedPurchase || typeof adaptedPurchase !== 'object') {
                return {};
            }
            
            // Normalizar status
            if (adaptedPurchase.status === undefined && adaptedPurchase.estado !== undefined) {
                adaptedPurchase.status = adaptedPurchase.estado;
            }
            
            // Normalizar fechas
            if (adaptedPurchase.purchaseDate === undefined) {
                if (adaptedPurchase.purchase_date !== undefined) {
                    adaptedPurchase.purchaseDate = adaptedPurchase.purchase_date;
                } else if (adaptedPurchase.fecha_compra !== undefined) {
                    adaptedPurchase.purchaseDate = adaptedPurchase.fecha_compra;
                }
            }
            
            // Normalizar monto total
            if (adaptedPurchase.totalAmount === undefined) {
                if (adaptedPurchase.total !== undefined) {
                    adaptedPurchase.totalAmount = adaptedPurchase.total;
                } else if (adaptedPurchase.total_amount !== undefined) {
                    adaptedPurchase.totalAmount = adaptedPurchase.total_amount;
                }
            }
            
            // Normalizar nombre del proveedor basado en código original purchases.js
            if (adaptedPurchase.providerName === undefined) {
                if (adaptedPurchase.provider && adaptedPurchase.provider.company) {
                    adaptedPurchase.providerName = adaptedPurchase.provider.company;
                } else if (adaptedPurchase.proveedor && adaptedPurchase.proveedor.company) {
                    adaptedPurchase.providerName = adaptedPurchase.proveedor.company;
                } else if (adaptedPurchase.provider && adaptedPurchase.provider.name) {
                    adaptedPurchase.providerName = adaptedPurchase.provider.name;
                } else if (adaptedPurchase.proveedor && adaptedPurchase.proveedor.name) {
                    adaptedPurchase.providerName = adaptedPurchase.proveedor.name;
                } else if (adaptedPurchase.provider_name !== undefined) {
                    adaptedPurchase.providerName = adaptedPurchase.provider_name;
                } else if (adaptedPurchase.nombre_proveedor !== undefined) {
                    adaptedPurchase.providerName = adaptedPurchase.nombre_proveedor;
                }
            }
            
            return adaptedPurchase;
        }).filter(purchase => purchase && typeof purchase === 'object' && Object.keys(purchase).length > 0);
        
        const currentMonth = getFirstDayOfMonth();
        const previousMonth = getFirstDayOfPreviousMonth();
        
        // Filtrar compras del mes actual
        const currentMonthPurchases = purchases.filter(purchase => {
            if (!purchase.purchaseDate) return false;
            const purchaseDate = new Date(purchase.purchaseDate);
            return purchaseDate >= currentMonth && (purchase.status === 'completed' || purchase.status === 'active');
        });
        
        // Filtrar compras del mes anterior
        const previousMonthPurchases = purchases.filter(purchase => {
            if (!purchase.purchaseDate) return false;
            const purchaseDate = new Date(purchase.purchaseDate);
            return purchaseDate >= previousMonth && purchaseDate < currentMonth && (purchase.status === 'completed' || purchase.status === 'active');
        });
        
        // Calcular totales
        const currentMonthTotal = currentMonthPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
        const previousMonthTotal = previousMonthPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
        
        // Obtener compras más recientes basándose en ID (últimas agregadas tienen ID más alto)
        const recentPurchases = purchases
            .filter(purchase => purchase.status === 'completed' || purchase.status === 'active')
            .sort((a, b) => {
                // Ordenar por ID descendente para obtener las últimas agregadas
                const idA = parseInt(a.id?.replace(/\D/g, '') || a._id || '0');
                const idB = parseInt(b.id?.replace(/\D/g, '') || b._id || '0');
                return idB - idA;
            })
            .slice(0, 5);
        
        // Obtener datos para gráfica (últimos 6 meses)
        const chartData = getPurchasesChartData(purchases);

        dashboardData.purchases = {
            totalThisMonth: currentMonthTotal,
            ordersThisMonth: currentMonthPurchases.length,
            recentPurchases: recentPurchases,
            chartData: chartData
        };
        
    } catch (error) {
        dashboardData.purchases = {
            totalThisMonth: 0,
            ordersThisMonth: 0,
            recentPurchases: [],
            chartData: []
        };
    }
}

/**
 * Carga datos de clientes
 */
async function loadCustomersData() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(API_CUSTOMERS, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar clientes');
        }
        
        let data = await response.json();
        
        // Manejar diferentes estructuras de respuesta
        let customers = [];
        if (data && typeof data === 'object' && data.customers) {
            customers = data.customers;
        } 
        else if (Array.isArray(data)) {
            customers = data;
        }
        else if (data && typeof data === 'object') {
            const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (arrayProps.length > 0) {
                customers = data[arrayProps[0]];
            } else {
                customers = [];
            }
        }
        
        if (!Array.isArray(customers)) {
            customers = [];
        }
        
        // Normalizar los clientes
        customers = customers.map(customer => {
            let adaptedCustomer = {...customer};
            
            if (!adaptedCustomer || typeof adaptedCustomer !== 'object') {
                return {};
            }
            
            // Normalizar status
            if (adaptedCustomer.status === undefined && adaptedCustomer.estado !== undefined) {
                adaptedCustomer.status = adaptedCustomer.estado;
            }
            
            // Normalizar fechas de creación
            if (adaptedCustomer.createdAt === undefined) {
                if (adaptedCustomer.created_at !== undefined) {
                    adaptedCustomer.createdAt = adaptedCustomer.created_at;
                } else if (adaptedCustomer.registrationDate !== undefined) {
                    adaptedCustomer.createdAt = adaptedCustomer.registrationDate;
                } else if (adaptedCustomer.fecha_registro !== undefined) {
                    adaptedCustomer.createdAt = adaptedCustomer.fecha_registro;
                }
            }
            
            return adaptedCustomer;
        }).filter(customer => customer && typeof customer === 'object' && Object.keys(customer).length > 0);
        
        const currentMonth = getFirstDayOfMonth();
        
        // Filtrar clientes nuevos del mes actual
        const newThisMonth = customers.filter(customer => {
            if (!customer.createdAt) return false;
            const customerDate = new Date(customer.createdAt);
            return customerDate >= currentMonth && (customer.status === 'active' || customer.status === 'activo');
        }).length;
        
        // Obtener clientes más recientes basándose en ID (últimos agregados tienen ID más alto)
        const recentCustomers = customers
            .filter(customer => customer.status === 'active' || customer.status === 'activo')
            .sort((a, b) => {
                // Ordenar por ID descendente para obtener los últimos agregados
                const idA = parseInt(a.id?.replace(/\D/g, '') || a._id || '0');
                const idB = parseInt(b.id?.replace(/\D/g, '') || b._id || '0');
                return idB - idA;
            })
            .slice(0, 5);
        
        dashboardData.customers = {
            total: customers.filter(c => c.status === 'active' || c.status === 'activo').length,
            newThisMonth: newThisMonth,
            recentCustomers: recentCustomers
        };
        
    } catch (error) {
        dashboardData.customers = {
            total: 0,
            newThisMonth: 0,
            recentCustomers: []
        };
    }
}

/**
 * Carga datos de productos
 */
async function loadProductsData() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(API_PRODUCTS, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }
        
        let data = await response.json();
        
        // Manejar diferentes estructuras de respuesta
        let products = [];
        if (data && typeof data === 'object' && data.products) {
            products = data.products;
        } 
        else if (Array.isArray(data)) {
            products = data;
        }
        else if (data && typeof data === 'object') {
            const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (arrayProps.length > 0) {
                products = data[arrayProps[0]];
            } else {
                products = [];
            }
        }
        
        if (!Array.isArray(products)) {
            products = [];
        }
        
        // Normalizar los productos
        products = products.map(product => {
            let adaptedProduct = {...product};
            
            if (!adaptedProduct || typeof adaptedProduct !== 'object') {
                return {};
            }
            
            // Normalizar status
            if (adaptedProduct.status === undefined && adaptedProduct.estado !== undefined) {
                adaptedProduct.status = adaptedProduct.estado;
            }
            
            // Normalizar fechas - simple como los otros elementos
            if (adaptedProduct.createdAt === undefined && adaptedProduct.created_at !== undefined) {
                adaptedProduct.createdAt = adaptedProduct.created_at;
            }
            
            if (adaptedProduct.updatedAt === undefined && adaptedProduct.updated_at !== undefined) {
                adaptedProduct.updatedAt = adaptedProduct.updated_at;
            }
            
            return adaptedProduct;
        }).filter(product => product && typeof product === 'object' && Object.keys(product).length > 0);
        
        // Contar productos con stock bajo (menos de 10 unidades)
        const lowStock = products.filter(product => 
            (product.status === 'active' || product.status === 'activo') && (product.stock || 0) < 10
        ).length;
        
        // Obtener producto con stock más bajo para el dashboard
        const lowStockProduct = products
            .filter(product => (product.status === 'active' || product.status === 'activo') && (product.stock || 0) > 0)
            .sort((a, b) => {
                // Ordenar por stock ascendente para obtener el más bajo
                const stockA = parseInt(a.stock || 0);
                const stockB = parseInt(b.stock || 0);
                return stockA - stockB;
            })
            .slice(0, 1);
        
        dashboardData.products = {
            total: products.filter(p => p.status === 'active' || p.status === 'activo').length,
            lowStock: lowStock,
            lowStockProduct: lowStockProduct
        };
        
    } catch (error) {
        dashboardData.products = {
            total: 0,
            lowStock: 0,
            recentProducts: []
        };
    }
}

// ===== FUNCIONES DE RENDERIZADO =====

/**
 * Actualiza el widget de ventas
 */
function updateSalesWidget() {
    const salesWidget = document.querySelector('.widget:first-child');
    if (!salesWidget) {
        return;
    }
    
    const statValues = salesWidget.querySelectorAll('.stat-value');
    const statLabels = salesWidget.querySelectorAll('.stat-label');
    
    if (statValues.length >= 2) {
        const formattedAmount = formatCurrency(dashboardData.sales.totalThisMonth);
        
        statValues[0].textContent = formattedAmount;
        statValues[1].textContent = dashboardData.sales.transactionsThisMonth;
        
        // Ocultar el tercer elemento (crecimiento)
        if (statValues[2]) {
            statValues[2].parentElement.style.display = 'none';
        }
    }
}

/**
 * Actualiza el widget de compras
 */
function updatePurchasesWidget() {
    const purchasesWidget = document.querySelector('.widget:last-child');
    if (!purchasesWidget) {
        return;
    }
    
    const statValues = purchasesWidget.querySelectorAll('.stat-value');
    
    if (statValues.length >= 2) {
        const formattedAmount = formatCurrency(dashboardData.purchases.totalThisMonth);
        
        statValues[0].textContent = formattedAmount;
        statValues[1].textContent = dashboardData.purchases.ordersThisMonth;
        
        // Ocultar el tercer elemento (reducción)
        if (statValues[2]) {
            statValues[2].parentElement.style.display = 'none';
        }
    }
}

/**
 * Actualiza la sección de actividad reciente
 */
function updateRecentActivity() {
    const activityContainer = document.querySelector('.recent-activity');
    if (!activityContainer) return;
    
    // Buscar los 4 elementos de actividad fijos
    const activityItems = activityContainer.querySelectorAll('.activity-item');
    if (activityItems.length < 4) return;
    
    // Elemento 1: Ventas (💰)
    const salesItem = activityItems[0];
    const salesTitleElement = salesItem.querySelector('.activity-title');
    const salesTimeElement = salesItem.querySelector('.activity-time');
    
    if (dashboardData.sales.recentSales.length > 0) {
        const latestSale = dashboardData.sales.recentSales[0];
        if (salesTitleElement) {
            salesTitleElement.textContent = `Nueva venta registrada - Cliente: ${latestSale.customerName || 'Cliente'}`;
        }
        if (salesTimeElement) {
            // Usar fecha de creación del registro, no fecha de venta
            const dateToUse = latestSale.createdAt || latestSale.created_at || latestSale.saleDate;
            salesTimeElement.textContent = getTimeAgo(dateToUse);
        }
        salesItem.style.display = 'flex';
    } else {
        if (salesTitleElement) {
            salesTitleElement.textContent = 'Sin ventas recientes';
        }
        if (salesTimeElement) {
            salesTimeElement.textContent = '-';
        }
        salesItem.style.display = 'flex';
    }
    
    // Elemento 2: Compras (🛒)
    const purchaseItem = activityItems[1];
    const purchaseTitleElement = purchaseItem.querySelector('.activity-title');
    const purchaseTimeElement = purchaseItem.querySelector('.activity-time');
    
    if (dashboardData.purchases.recentPurchases.length > 0) {
        const latestPurchase = dashboardData.purchases.recentPurchases[0];
        if (purchaseTitleElement) {
            purchaseTitleElement.textContent = `Compra realizada - Proveedor: ${latestPurchase.providerName || 'Proveedor'}`;
        }
        if (purchaseTimeElement) {
            // Usar fecha de creación del registro, no fecha de compra
            const dateToUse = latestPurchase.createdAt || latestPurchase.created_at || latestPurchase.purchaseDate;
            purchaseTimeElement.textContent = getTimeAgo(dateToUse);
        }
        purchaseItem.style.display = 'flex';
    } else {
        if (purchaseTitleElement) {
            purchaseTitleElement.textContent = 'Sin compras recientes';
        }
        if (purchaseTimeElement) {
            purchaseTimeElement.textContent = '-';
        }
        purchaseItem.style.display = 'flex';
    }
    
    // Elemento 3: Clientes (👤)
    const customerItem = activityItems[2];
    const customerTitleElement = customerItem.querySelector('.activity-title');
    const customerTimeElement = customerItem.querySelector('.activity-time');
    
    if (dashboardData.customers.recentCustomers.length > 0) {
        const latestCustomer = dashboardData.customers.recentCustomers[0];
        if (customerTitleElement) {
            customerTitleElement.textContent = `Nuevo cliente registrado - ${latestCustomer.name || latestCustomer.companyName || 'Cliente'}`;
        }
        if (customerTimeElement) {
            customerTimeElement.textContent = getTimeAgo(latestCustomer.createdAt);
        }
        customerItem.style.display = 'flex';
    } else {
        if (customerTitleElement) {
            customerTitleElement.textContent = 'Sin clientes nuevos';
        }
        if (customerTimeElement) {
            customerTimeElement.textContent = '-';
        }
        customerItem.style.display = 'flex';
    }
    
    // Elemento 4: Productos (📋)
    const productItem = activityItems[3];
    const productTitleElement = productItem.querySelector('.activity-title');
    const productTimeElement = productItem.querySelector('.activity-time');
    
    if (dashboardData.products.lowStockProduct.length > 0) {
        const lowStockItem = dashboardData.products.lowStockProduct[0];
        
        if (productTitleElement) {
            productTitleElement.textContent = `⚠️ Stock bajo - ${lowStockItem.name || 'Producto'}`;
        }
        if (productTimeElement) {
            // Mostrar el stock actual del producto con menor inventario
            const stock = lowStockItem.stock || 0;
            productTimeElement.textContent = `Solo quedan ${stock}`;
        }
        productItem.style.display = 'flex';
    } else if (dashboardData.products.lowStock > 0) {
        if (productTitleElement) {
            productTitleElement.textContent = `Productos con stock bajo - ${dashboardData.products.lowStock} productos`;
        }
        if (productTimeElement) {
            productTimeElement.textContent = 'Stock actual';
        }
        productItem.style.display = 'flex';
    } else {
        if (productTitleElement) {
            productTitleElement.textContent = 'Sin actualizaciones de inventario';
        }
        if (productTimeElement) {
            productTimeElement.textContent = '-';
        }
        productItem.style.display = 'flex';
    }
}

/**
 * Actualiza solo los tiempos de actividad reciente (sin recargar datos)
 */
function updateActivityTimes() {
    const activityItems = document.querySelectorAll('.recent-activity .activity-item');
    if (activityItems.length < 4) return;
    
    // Actualizar tiempo de ventas
    if (dashboardData.sales.recentSales.length > 0) {
        const latestSale = dashboardData.sales.recentSales[0];
        const salesTimeElement = activityItems[0].querySelector('.activity-time');
        if (salesTimeElement) {
            const dateToUse = latestSale.createdAt || latestSale.created_at || latestSale.saleDate;
            salesTimeElement.textContent = getTimeAgo(dateToUse);
        }
    }
    
    // Actualizar tiempo de compras
    if (dashboardData.purchases.recentPurchases.length > 0) {
        const latestPurchase = dashboardData.purchases.recentPurchases[0];
        const purchaseTimeElement = activityItems[1].querySelector('.activity-time');
        if (purchaseTimeElement) {
            const dateToUse = latestPurchase.createdAt || latestPurchase.created_at || latestPurchase.purchaseDate;
            purchaseTimeElement.textContent = getTimeAgo(dateToUse);
        }
    }
    
    // Actualizar tiempo de clientes
    if (dashboardData.customers.recentCustomers.length > 0) {
        const latestCustomer = dashboardData.customers.recentCustomers[0];
        const customerTimeElement = activityItems[2].querySelector('.activity-time');
        if (customerTimeElement) {
            customerTimeElement.textContent = getTimeAgo(latestCustomer.createdAt);
        }
    }
    
    // Actualizar información de producto con stock bajo
    if (dashboardData.products.lowStockProduct.length > 0) {
        const lowStockItem = dashboardData.products.lowStockProduct[0];
        const productTimeElement = activityItems[3].querySelector('.activity-time');
        if (productTimeElement) {
            // Mostrar el stock actual del producto con menor inventario
            const stock = lowStockItem.stock || 0;
            productTimeElement.textContent = `Solo quedan ${stock}`;
        }
    }
}

/**
 * Actualiza todos los widgets del dashboard
 */
function updateDashboard() {
    updateSalesWidget();
    updatePurchasesWidget();
    updateRecentActivity();
    updateSalesChart();
    updatePurchasesChart();
}

// ===== FUNCIONES DE INICIALIZACIÓN =====

/**
 * Carga todos los datos del dashboard
 */
async function loadDashboardData() {
    try {
        // Cargar datos en paralelo
        await Promise.all([
            loadSalesData(),
            loadPurchasesData(),
            loadCustomersData(),
            loadProductsData()
        ]);
        
        // Actualizar la interfaz
        updateDashboard();
        
    } catch (error) {
        console.error('❌ Error cargando datos del dashboard:', error);
    }
}

/**
 * Inicializa el dashboard
 */
function initializeDashboard() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar datos iniciales
    loadDashboardData();
    
    // Configurar actualización automática cada 5 minutos
    setInterval(loadDashboardData, 5 * 60 * 1000);
}

// ===== FUNCIONES DE GRÁFICAS =====

/**
 * Genera datos para la gráfica de ventas (últimos 6 meses)
 */
function getSalesChartData(salesData) {
    const today = new Date();
    const chartData = [];
    
    // Generar datos para los últimos 6 meses
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
        
        // Filtrar ventas de este mes
        const monthSales = salesData.filter(sale => {
            if (!sale.saleDate && !sale.sales_date && !sale.fecha_venta) return false;
            const saleDate = new Date(sale.saleDate || sale.sales_date || sale.fecha_venta);
            return saleDate >= date && saleDate < nextMonth && (sale.status === 'completed' || sale.status === 'active');
        });
        
        const monthTotal = monthSales.reduce((sum, sale) => sum + (sale.totalAmount || sale.total || sale.total_amount || 0), 0);
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        chartData.push({
            month: monthNames[date.getMonth()],
            value: monthTotal,
            count: monthSales.length
        });
    }
    
    return chartData;
}

/**
 * Genera datos para la gráfica de compras (últimos 6 meses)
 */
function getPurchasesChartData(purchasesData) {
    const today = new Date();
    const chartData = [];
    
    // Generar datos para los últimos 6 meses
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
        
        // Filtrar compras de este mes
        const monthPurchases = purchasesData.filter(purchase => {
            if (!purchase.purchaseDate && !purchase.purchase_date && !purchase.fecha_compra) return false;
            const purchaseDate = new Date(purchase.purchaseDate || purchase.purchase_date || purchase.fecha_compra);
            return purchaseDate >= date && purchaseDate < nextMonth && (purchase.status === 'completed' || purchase.status === 'active');
        });
        
        const monthTotal = monthPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || purchase.total || purchase.total_amount || 0), 0);
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        chartData.push({
            month: monthNames[date.getMonth()],
            value: monthTotal,
            count: monthPurchases.length
        });
    }
    
    return chartData;
}

/**
 * Actualiza la gráfica de ventas con datos reales
 */
function updateSalesChart() {
    const chartData = dashboardData.sales.chartData || [];
    if (chartData.length === 0) return;
    
    const svgElement = document.querySelector('.widget:first-child .chart-container svg');
    if (!svgElement) return;
    
    // Calcular valor máximo, con mínimo de 1 para evitar división por 0
    const maxValue = Math.max(1, Math.max(...chartData.map(d => d.value || 0)));
    
    // Generar puntos para la línea
    const points = chartData.map((data, index) => {
        const x = chartData.length > 1 ? (index / (chartData.length - 1)) * 400 : 200;
        const value = data.value || 0;
        const y = Math.max(20, 120 - ((value / maxValue) * 100)); // Mínimo y=20
        return `${x},${y}`;
    }).join(' ');
    
    // Actualizar la línea
    const polyline = svgElement.querySelector('polyline');
    if (polyline) {
        polyline.setAttribute('points', points);
    }
    
    // Actualizar el área
    const path = svgElement.querySelector('path');
    if (path) {
        const pathData = `M${points} L400,120 L0,120 Z`;
        path.setAttribute('d', pathData);
    }
    
    // Actualizar los círculos
    const circles = svgElement.querySelectorAll('circle');
    for (let i = 0; i < Math.min(chartData.length, circles.length); i++) {
        if (circles[i] && chartData[i]) {
            const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 400 : 200;
            const value = chartData[i].value || 0;
            const y = Math.max(20, 120 - ((value / maxValue) * 100));
            circles[i].setAttribute('cx', x);
            circles[i].setAttribute('cy', y);
        }
    }
}

/**
 * Actualiza la gráfica de compras con datos reales
 */
function updatePurchasesChart() {
    const chartData = dashboardData.purchases.chartData || [];
    if (chartData.length === 0) return;
    
    const svgElement = document.querySelector('.widget:last-child .chart-container svg');
    if (!svgElement) return;
    
    const rects = svgElement.querySelectorAll('rect');
    if (rects.length === 0) return;
    
    // Calcular valor máximo, con mínimo de 1 para evitar división por 0
    const maxValue = Math.max(1, Math.max(...chartData.map(d => d.value || 0)));
    
    // Actualizar las barras - usar solo las primeras 6 barras para 6 meses
    for (let i = 0; i < Math.min(chartData.length, rects.length); i++) {
        if (rects[i] && chartData[i]) {
            const value = chartData[i].value || 0;
            const height = Math.max(5, (value / maxValue) * 90); // Mínimo 5px de altura
            const y = 120 - height;
            rects[i].setAttribute('height', height);
            rects[i].setAttribute('y', y);
        }
    }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    
    // Actualizar solo los tiempos de actividad reciente cada minuto
    setInterval(() => {
        updateActivityTimes();
    }, 60 * 1000); // Cada 60 segundos
}); 