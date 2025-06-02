// ===== MÓDULO DE EXPORTACIONES PARA VENTAS - VERSIÓN COMPLETA MEJORADA =====

// Función para cargar las librerías necesarias
function loadExportLibraries() {
  return new Promise((resolve, reject) => {
    let scriptsToLoad = 0;
    let scriptsLoaded = 0;

    function checkComplete() {
      scriptsLoaded++;
      if (scriptsLoaded === scriptsToLoad) {
        // Pequeña pausa para asegurar que las librerías estén completamente cargadas
        setTimeout(resolve, 100);
      }
    }

    // Cargar jsPDF para PDF
    if (!window.jsPDF) {
      scriptsToLoad++;
      const jsPDFScript = document.createElement('script');
      jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jsPDFScript.onload = checkComplete;
      jsPDFScript.onerror = () => reject(new Error('Error al cargar jsPDF'));
      document.head.appendChild(jsPDFScript);
    }

    // Cargar jsPDF AutoTable para tablas
    if (!window.jsPDF || !window.jsPDF.API || !window.jsPDF.API.autoTable) {
      scriptsToLoad++;
      const autoTableScript = document.createElement('script');
      autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
      autoTableScript.onload = checkComplete;
      autoTableScript.onerror = () => reject(new Error('Error al cargar AutoTable'));
      document.head.appendChild(autoTableScript);
    }

    // Cargar SheetJS para Excel
    if (!window.XLSX) {
      scriptsToLoad++;
      const xlsxScript = document.createElement('script');
      xlsxScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      xlsxScript.onload = checkComplete;
      xlsxScript.onerror = () => reject(new Error('Error al cargar XLSX'));
      document.head.appendChild(xlsxScript);
    }

    if (scriptsToLoad === 0) {
      resolve();
    }
  });
}

// Función para obtener datos de ventas con filtros
function getFilteredSalesData(searchTerm = '', dateFrom = '', dateTo = '', customerFilter = '', statusFilter = '') {
  let filteredSales = [...originalSales];

  // Filtro por término de búsqueda
  if (searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    filteredSales = filteredSales.filter(s => {
      const customerMatch = 
        (s.customer?.name && s.customer.name.toLowerCase().includes(term)) ||
        (s.customer?.lastname && s.customer.lastname.toLowerCase().includes(term)) ||
        (s.cliente?.name && s.cliente.name.toLowerCase().includes(term)) ||
        (s.cliente?.lastname && s.cliente.lastname.toLowerCase().includes(term)) ||
        (typeof s.customer === 'string' && customerIdToNameMap[s.customer] && customerIdToNameMap[s.customer].toLowerCase().includes(term)) ||
        (typeof s.cliente === 'string' && customerIdToNameMap[s.cliente] && customerIdToNameMap[s.cliente].toLowerCase().includes(term));
      
      const productsMatch = 
        (s.products && Array.isArray(s.products) && s.products.some(item => {
          if (item.product?.name) {
            return item.product.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.product]) {
            return productIdToNameMap[item.product].toLowerCase().includes(term);
          }
          return false;
        })) ||
        (s.productos && Array.isArray(s.productos) && s.productos.some(item => {
          if (item.producto?.name) {
            return item.producto.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.producto]) {
            return productIdToNameMap[item.producto].toLowerCase().includes(term);
          }
          return false;
        }));
      
      return customerMatch || productsMatch || (s.id && s.id.toLowerCase().includes(term));
    });
  }

  // Filtro por rango de fechas
  if (dateFrom || dateTo) {
    filteredSales = filteredSales.filter(s => {
      const salesDate = new Date(s.sales_date || s.fecha_venta || s.salesDate);
      if (isNaN(salesDate.getTime())) return false;
      
      if (dateFrom && salesDate < new Date(dateFrom)) return false;
      if (dateTo && salesDate > new Date(dateTo)) return false;
      
      return true;
    });
  }

  // Filtro por cliente
  if (customerFilter) {
    filteredSales = filteredSales.filter(s => {
      const customerId = s.customer?._id || s.customer || s.cliente?._id || s.cliente;
      return customerId === customerFilter;
    });
  }

  // Filtro por estado
  if (statusFilter) {
    filteredSales = filteredSales.filter(s => {
      const status = s.status || s.estado || 'processing';
      return status === statusFilter;
    });
  }

  return filteredSales;
}

// Función para preparar datos para exportación
function prepareExportData(sales) {
  return sales.map((sale, index) => {
    const saleId = sale._id || "";
    const displayId = sale.id || saleId || `Sa${String(index + 1).padStart(2, '0')}`;
    
    let customerName = "Sin Cliente";
    if (sale.customer) {
      if (typeof sale.customer === 'object' && sale.customer.name) {
        customerName = `${sale.customer.name} ${sale.customer.lastname || ''}`.trim();
      } else {
        customerName = getCustomerNameById(sale.customer);
      }
    } else if (sale.cliente) {
      if (typeof sale.cliente === 'object' && sale.cliente.name) {
        customerName = `${sale.cliente.name} ${sale.cliente.lastname || ''}`.trim();
      } else {
        customerName = getCustomerNameById(sale.cliente);
      }
    }
    
    const salesDate = sale.sales_date || sale.fecha_venta || sale.salesDate;
    const status = sale.status || sale.estado || "processing";
    const total = sale.total || 0;
    
    // Obtener productos
    let products = [];
    if (sale.products && Array.isArray(sale.products)) {
      products = sale.products;
    } else if (sale.productos && Array.isArray(sale.productos)) {
      products = sale.productos.map(item => ({
        product: item.producto,
        quantity: item.cantidad,
        sale_price: item.precio_venta,
        total: item.total
      }));
    }
    
    // Crear lista de productos para PDF (sin cantidades)
    const productsList = products.map(item => {
      const productName = item.product?.name || getProductNameById(item.product?._id || item.product);
      return productName;
    }).join('\n');
    
    // Calcular cantidad total de productos
    const totalQuantity = products.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Lista detallada para Excel
    const productsDetailedList = products.map(item => {
      const productName = item.product?.name || getProductNameById(item.product?._id || item.product);
      return `${productName} - Cant: ${item.quantity} - Precio: ${formatCurrency(item.sale_price)} - Total: ${formatCurrency(item.total)}`;
    }).join(' | ');
    
    const statusTranslation = {
      'processing': 'Procesando',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    
    return {
      id: displayId,
      cliente: customerName,
      fecha: formatDate(salesDate),
      productos: productsList,
      cantidad: totalQuantity,
      productosDetallados: productsDetailedList,
      total: total,
      totalFormatted: formatCurrency(total),
      estado: statusTranslation[status] || status,
      rawDate: salesDate,
      productCount: products.length,
      productItems: products
    };
  });
}

// ===== EXPORTACIÓN A PDF MEJORADA =====
async function exportToPDF(filters = {}) {
  try {
    showLoadingIndicator();
    
    // Cargar librerías necesarias
    await loadExportLibraries();
    
    // VERIFICAR Y CARGAR jsPDF
    let jsPDF;
    
    if (window.jsPDF) {
      jsPDF = window.jsPDF;
    } else if (window.jspdf && window.jspdf.jsPDF) {
      jsPDF = window.jspdf.jsPDF;
      window.jsPDF = jsPDF;
    } else {
      throw new Error('jsPDF no está disponible');
    }
    
    // Verificar que autoTable esté disponible
    if (!jsPDF.API || !jsPDF.API.autoTable) {
      throw new Error('jsPDF AutoTable no está disponible');
    }
    
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    
    // Obtener datos filtrados
    const filteredSales = getFilteredSalesData(
      filters.searchTerm,
      filters.dateFrom,
      filters.dateTo,
      filters.customerFilter,
      filters.statusFilter
    );
    
    const exportData = prepareExportData(filteredSales);
    
    // Configuración del documento
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;
    
    // Encabezado profesional
    doc.setFillColor(27, 43, 64);
    doc.rect(0, 0, pageWidth, 30, 'F');

    // Agregar logo de ICESOFT (opcional)
    try {
      doc.addImage('assets/icesoft.png', 'PNG', 5, 5, 20, 20);
    } catch (error) {
      console.warn('No se pudo cargar el logo ICESOFT:', error);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE VENTAS', 30, 20);
    yPosition = 45;
    doc.setTextColor(0, 0, 0);

    // Fecha y hora
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(10);
    const now = new Date();
    doc.text(`Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`, 
            pageWidth - margin, 20, { align: 'right' });

    yPosition = 50;
    doc.setTextColor(0, 0, 0);
    
    // Filtros aplicados
    if (filters.searchTerm || filters.dateFrom || filters.dateTo || filters.customerFilter || filters.statusFilter) {
      doc.setFont('helvetica', 'bold');
      doc.text('FILTROS APLICADOS:', margin, yPosition);
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      
      if (filters.searchTerm) {
        doc.text(`• Término de búsqueda: ${filters.searchTerm}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (filters.dateFrom || filters.dateTo) {
        const dateRange = `${filters.dateFrom || 'Sin límite'} hasta ${filters.dateTo || 'Sin límite'}`;
        doc.text(`• Rango de fechas: ${dateRange}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (filters.customerFilter) {
        const customerName = getCustomerNameById(filters.customerFilter) || 'Cliente no encontrado';
        doc.text(`• Cliente: ${customerName}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (filters.statusFilter) {
        const statusNames = {
          'processing': 'Procesando', 
          'completed': 'Completada',
          'cancelled': 'Cancelada'
        };
        doc.text(`• Estado: ${statusNames[filters.statusFilter] || filters.statusFilter}`, margin + 5, yPosition);
        yPosition += 8;
      }
      yPosition += 10;
    }
    
    // Resumen estadístico
    const totalAmount = exportData.reduce((sum, item) => sum + (item.total || 0), 0);
    const completedCount = exportData.filter(item => item.estado === 'Completada').length;
    const cancelledCount = exportData.filter(item => item.estado === 'Cancelada').length;
    const processingCount = exportData.filter(item => item.estado === 'Procesando').length;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN ESTADÍSTICO', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ventas procesando: ${processingCount}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Ventas completadas: ${completedCount}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Ventas canceladas: ${cancelledCount}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total general: ${formatCurrency(totalAmount)}`, margin, yPosition);
    yPosition += 25;
    
    // TABLA PRINCIPAL DE VENTAS
    if (exportData.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE VENTAS', margin, yPosition);
      yPosition += 15;
      
      // Preparar datos para la tabla
      const tableData = exportData.map((sale) => [
        sale.id || '',
        sale.cliente || '',
        sale.fecha || '',
        sale.productos || '',
        sale.cantidad || 0,
        sale.totalFormatted || '',
        sale.estado || ''
      ]);
      
      // Configurar tabla con autoTable - COLUMNAS OPTIMIZADAS
      doc.autoTable({
        startY: yPosition,
        head: [['ID', 'Cliente', 'Fecha', 'Productos', 'Cantidad', 'Total', 'Estado']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          font: 'helvetica',
          cellPadding: 4,
          valign: 'middle',
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [27, 43, 64],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: {
          0: { 
            cellWidth: 15, 
            halign: 'center',
            valign: 'middle'
          },
          1: { 
            cellWidth: 35, 
            halign: 'left',
            valign: 'middle'
          },
          2: { 
            cellWidth: 20, 
            halign: 'center',
            valign: 'middle'
          },
          3: { 
            cellWidth: 35, 
            halign: 'left',
            valign: 'top',
            fontSize: 7
          },
          4: { 
            cellWidth: 25, 
            halign: 'center',
            valign: 'middle'
          },
          5: { 
            cellWidth: 25, 
            halign: 'right',
            valign: 'middle'
          },
          6: { 
            cellWidth: 25, 
            halign: 'center',
            valign: 'middle'
          }
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        tableWidth: 'auto',
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.1,
        didParseCell: function(data) {
          if (data.column.index === 3 && data.cell.text && data.cell.text.length > 0) {
            const lines = data.cell.text.join(' ').split('\n');
            if (lines.length > 1) {
              data.cell.styles.minCellHeight = lines.length * 8;
            }
          }
        },
        margin: { 
          left: (pageWidth - 180) / 2,
          right: (pageWidth - 180) / 2
        }
      });
      
      yPosition = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      const noDataText = 'No se encontraron ventas con los filtros aplicados.';
      const textWidth = doc.getTextWidth(noDataText);
      doc.text(noDataText, (pageWidth - textWidth) / 2, yPosition);
    }
    
    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const footerY = pageHeight - 15;
      doc.text('ICESOFT - Sistema de Gestión', margin, footerY);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      
      doc.setFontSize(7);
      const footerDate = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(footerDate, pageWidth / 2, footerY, { align: 'center' });
    }
    
    // GUARDAR ARCHIVO
    const fileName = `Ventas_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    hideLoadingIndicator();
    showSuccess(`PDF generado exitosamente: ${fileName}`);
    
  } catch (error) {
    hideLoadingIndicator();
    showError(`Error al generar PDF: ${error.message}`);
    console.error('Error completo:', error);
  }
}

// ===== EXPORTACIÓN A EXCEL CON DISEÑO VISUAL MEJORADO =====
async function exportToExcel(filters = {}) {
  try {
    showLoadingIndicator();
    await loadExportLibraries();
    
    // Obtener datos filtrados
    const filteredSales = getFilteredSalesData(
      filters.searchTerm,
      filters.dateFrom,
      filters.dateTo,
      filters.customerFilter,
      filters.statusFilter
    );
    
    const exportData = prepareExportData(filteredSales);
    
    // Crear nuevo workbook
    const wb = XLSX.utils.book_new();
    
    // ===== HOJA 1: RESUMEN EJECUTIVO CON DISEÑO PROFESIONAL =====
    const currentDate = new Date();
    
    // Crear array de datos con formato estructurado
    const summaryData = [];
    
    // ENCABEZADO PRINCIPAL
    summaryData.push(['REPORTE DE VENTAS - ICESOFT', '', '', '']);
    summaryData.push(['RESUMEN EJECUTIVO', '', '', '']);
    summaryData.push(['', '', '', '']);
    
    // INFORMACIÓN GENERAL EN FORMATO DE TABLA
    summaryData.push(['INFORMACIÓN GENERAL', '', '', '']);
    summaryData.push(['Sistema:', 'ICESOFT - Gestión Empresarial', '', '']);
    summaryData.push(['Fecha de generación:', currentDate.toLocaleDateString('es-ES'), '', '']);
    summaryData.push(['Hora de generación:', currentDate.toLocaleTimeString('es-ES'), '', '']);
    summaryData.push(['Total de registros:', exportData.length, '', '']);
    summaryData.push(['', '', '', '']);
    
    // FILTROS APLICADOS
    summaryData.push(['FILTROS APLICADOS', '', '', '']);
    if (filters.searchTerm) {
      summaryData.push(['Término de búsqueda:', filters.searchTerm, '', '']);
    }
    if (filters.dateFrom || filters.dateTo) {
      const dateRange = `${filters.dateFrom || 'Sin límite'} - ${filters.dateTo || 'Sin límite'}`;
      summaryData.push(['Rango de fechas:', dateRange, '', '']);
    }
    if (filters.customerFilter) {
      summaryData.push(['Cliente:', getCustomerNameById(filters.customerFilter), '', '']);
    }
    if (filters.statusFilter) {
      const statusNames = {
        'processing': 'Procesando',
        'completed': 'Completada',
        'cancelled': 'Cancelada'
      };
      summaryData.push(['Estado:', statusNames[filters.statusFilter] || filters.statusFilter, '', '']);
    }
    summaryData.push(['', '', '', '']);
    
    // RESUMEN FINANCIERO CON FORMATO DESTACADO
    const totalAmount = exportData.reduce((sum, item) => sum + item.total, 0);
    const avgAmount = totalAmount / (exportData.length || 1);
    
    summaryData.push(['RESUMEN FINANCIERO', '', '', '']);
    summaryData.push(['Total General:', '', formatCurrency(totalAmount), '']);
    summaryData.push(['Promedio por Venta:', '', formatCurrency(avgAmount), '']);
    summaryData.push(['', '', '', '']);
    
    // ESTADÍSTICAS POR ESTADO
    const completedCount = exportData.filter(item => item.estado === 'Completada').length;
    const cancelledCount = exportData.filter(item => item.estado === 'Cancelada').length;
    const processingCount = exportData.filter(item => item.estado === 'Procesando').length;
    const completionRate = ((completedCount / exportData.length) * 100).toFixed(1);
    
    summaryData.push(['ESTADÍSTICAS POR ESTADO', '', '', '']);
    summaryData.push(['Estado', 'Cantidad', 'Porcentaje', '']);
    summaryData.push(['Procesando', processingCount, `${((processingCount / exportData.length) * 100).toFixed(1)}%`, '']);
    summaryData.push(['Completadas', completedCount, `${((completedCount / exportData.length) * 100).toFixed(1)}%`, '']);
    summaryData.push(['Canceladas', cancelledCount, `${((cancelledCount / exportData.length) * 100).toFixed(1)}%`, '']);
    summaryData.push(['', '', '', '']);
    summaryData.push(['TASA DE ÉXITO:', '', `${completionRate}%`, '']);
    
    // Crear hoja de resumen
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    
    // APLICAR ESTILOS PROFESIONALES AL RESUMEN
    const summaryStyles = {};
    
    // Combinar celdas para el título
    summaryWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Título principal
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Subtítulo
    ];
    
    // Configurar ancho de columnas
    summaryWs['!cols'] = [
      { width: 25 }, // Columna A - Etiquetas
      { width: 35 }, // Columna B - Valores
      { width: 20 }, // Columna C - Montos/Porcentajes
      { width: 15 }  // Columna D - Extra
    ];
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Ejecutivo');
    
    // ===== HOJA 2: DATOS PRINCIPALES CON FORMATO PROFESIONAL =====
    if (exportData.length > 0) {
      const detailData = exportData.map((sale, index) => ({
        'ID': sale.id,
        'Cliente': sale.cliente,
        'Fecha': sale.fecha,
        'Productos': sale.productosDetallados,
        'Items': sale.productCount,
        'Cantidad': sale.cantidad,
        'Total': sale.total,
        'Estado': sale.estado,
        'Observaciones': sale.estado === 'Completada' ? 'Finalizada exitosamente' : 
                        sale.estado === 'Cancelada' ? 'Requiere análisis' : 'En proceso'
      }));
      
      const detailWs = XLSX.utils.json_to_sheet(detailData);
      
      // Configurar ancho de columnas optimizado - COLUMNAS AJUSTADAS
      detailWs['!cols'] = [
        { width: 12 }, // ID
        { width: 25 }, // Cliente
        { width: 12 }, // Fecha
        { width: 40 }, // Productos
        { width: 8 },  // Items
        { width: 10 }, // Cantidad
        { width: 15 }, // Total
        { width: 12 }, // Estado
        { width: 20 }  // Observaciones
      ];
      
      XLSX.utils.book_append_sheet(wb, detailWs, 'Datos Principales');
    }
    
    // ===== HOJA 3: ANÁLISIS POR CLIENTE CON GRÁFICOS VISUALES =====
    if (exportData.length > 0) {
      const customerStats = {};
      
      exportData.forEach(sale => {
        const customer = sale.cliente;
        if (!customerStats[customer]) {
          customerStats[customer] = {
            totalVentas: 0,
            montoTotal: 0,
            ventasCompletadas: 0,
            ventasCanceladas: 0,
            ventasProcesando: 0,
            productos: new Set()
          };
        }
        
        customerStats[customer].totalVentas++;
        customerStats[customer].montoTotal += sale.total;
        
        if (sale.productItems && Array.isArray(sale.productItems)) {
          sale.productItems.forEach(product => {
            const productName = product.product?.name || getProductNameById(product.product?._id || product.product);
            customerStats[customer].productos.add(productName);
          });
        }
        
        switch(sale.estado) {
          case 'Completada':
            customerStats[customer].ventasCompletadas++;
            break;
          case 'Cancelada':
            customerStats[customer].ventasCanceladas++;
            break;
          case 'Procesando':
            customerStats[customer].ventasProcesando++;
            break;
        }
      });
      
      const totalAmount = exportData.reduce((sum, item) => sum + item.total, 0);
      
      const customerAnalysis = Object.entries(customerStats).map(([customer, stats]) => {
        const successRate = ((stats.ventasCompletadas / stats.totalVentas) * 100).toFixed(1);
        const participation = ((stats.montoTotal / totalAmount) * 100).toFixed(1);
        
        return {
          'Cliente': customer,
          'Total Ventas': stats.totalVentas,
          'Monto Total': stats.montoTotal,
          'Completadas': stats.ventasCompletadas,
          'Canceladas': stats.ventasCanceladas,
          'Procesando': stats.ventasProcesando,
          'Promedio/Venta': Math.round(stats.montoTotal / stats.totalVentas),
          'Productos Únicos': stats.productos.size,
          '% Participación': `${participation}%`,
          'Tasa Éxito': `${successRate}%`,
          'Calificación': successRate >= 80 ? 'EXCELENTE' : 
                           successRate >= 60 ? 'BUENO' : 
                           successRate >= 40 ? 'REGULAR' : 'MEJORAR'
        };
      });
      
      // Ordenar por monto total descendente
      customerAnalysis.sort((a, b) => b['Monto Total'] - a['Monto Total']);
      
      const customerWs = XLSX.utils.json_to_sheet(customerAnalysis);
      
      // Configurar anchos de columna
      customerWs['!cols'] = [
        { width: 25 }, // Cliente
        { width: 12 }, // Total Ventas
        { width: 15 }, // Monto Total
        { width: 12 }, // Completadas
        { width: 12 }, // Canceladas
        { width: 12 }, // Procesando
        { width: 15 }, // Promedio
        { width: 15 }, // Productos Únicos
        { width: 15 }, // Participación
        { width: 12 }, // Tasa Éxito
        { width: 15 }  // Calificación
      ];
      
      XLSX.utils.book_append_sheet(wb, customerWs, 'Análisis Clientes');
    }
    
    // ===== HOJA 4: DASHBOARD DE TENDENCIAS =====
    if (exportData.length > 0) {
      // Crear encabezado del dashboard
      const dashboardData = [];
      dashboardData.push(['DASHBOARD DE TENDENCIAS TEMPORALES', '', '', '', '', '']);
      dashboardData.push(['', '', '', '', '', '']);
      
      // Agregar análisis mensual
      const monthlyStats = {};
      exportData.forEach(sale => {
        const date = new Date(sale.rawDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            name: monthName,
            ventas: 0,
            total: 0,
            completadas: 0,
            canceladas: 0
          };
        }
        
        monthlyStats[monthKey].ventas++;
        monthlyStats[monthKey].total += sale.total;
        if (sale.estado === 'Completada') monthlyStats[monthKey].completadas++;
        if (sale.estado === 'Cancelada') monthlyStats[monthKey].canceladas++;
      });
      
      // Encabezados de la tabla
      dashboardData.push(['Período', 'Ventas', 'Total', 'Completadas', 'Canceladas', 'Tasa Éxito', 'Rendimiento']);
      
      const trendsData = Object.entries(monthlyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, stats]) => {
          const successRate = ((stats.completadas / stats.ventas) * 100).toFixed(1);
          const performance = stats.ventas > 10 ? 'ALTO' : 
                            stats.ventas > 5 ? 'MEDIO' : 
                            'BAJO';
          
          return [
            stats.name,
            stats.ventas,
            stats.total,
            stats.completadas,
            stats.canceladas,
            `${successRate}%`,
            performance
          ];
        });
      
      // Agregar datos a la tabla
      trendsData.forEach(row => dashboardData.push(row));
      
      // Agregar resumen final
      dashboardData.push(['', '', '', '', '', '', '']);
      dashboardData.push(['RESUMEN GENERAL', '', '', '', '', '', '']);
      
      const totalVentas = trendsData.reduce((sum, row) => sum + row[1], 0);
      const totalMonto = trendsData.reduce((sum, row) => sum + row[2], 0);
      const totalCompletadas = trendsData.reduce((sum, row) => sum + row[3], 0);
      const promedioMensual = Math.round(totalVentas / trendsData.length);
      
      dashboardData.push(['Total Períodos Analizados:', trendsData.length, '', '', '', '', '']);
      dashboardData.push(['Promedio Ventas/Mes:', promedioMensual, '', '', '', '', '']);
      dashboardData.push(['Mejor Período:', trendsData.sort((a,b) => b[1] - a[1])[0][0], '', '', '', '', '']);
      
      const trendsWs = XLSX.utils.aoa_to_sheet(dashboardData);
      
      // Configurar anchos
      trendsWs['!cols'] = [
        { width: 20 }, // Período
        { width: 10 }, // Ventas
        { width: 15 }, // Total
        { width: 12 }, // Completadas
        { width: 12 }, // Canceladas
        { width: 12 }, // Tasa Éxito
        { width: 15 }  // Rendimiento
      ];
      
      // Combinar celdas para el título
      trendsWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
      ];
      
      XLSX.utils.book_append_sheet(wb, trendsWs, 'Tendencias');
    }
    
    // ===== GUARDAR ARCHIVO CON NOMBRE DESCRIPTIVO =====
    const timestamp = new Date().toISOString().slice(0,16).replace(/[-:]/g, '').replace('T', '_');
    const fileName = `Ventas_Reporte_Ejecutivo_${timestamp}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    
    hideLoadingIndicator();
    showSuccess(`Archivo Excel generado exitosamente: ${fileName}`);
    
  } catch (error) {
    hideLoadingIndicator();
    showError('Error al generar Excel: ' + error.message);
    console.error('Error completo:', error);
  }
}

// ===== MODAL DE FILTROS PARA EXPORTACIÓN MEJORADO =====
function showExportModal() {
  const modalHtml = `
    <div id="exportModal" class="custom-modal">
      <div class="custom-modal-content">
        <div class="custom-modal-header">
          <h3 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 24px; font-weight: 600;">Exportar ventas</h3>
          <button class="modal-close" onclick="closeExportModal()">&times;</button>
        </div>
        
        <div class="custom-modal-body">
          <div class="export-filters">
            <div class="filters-grid">           
              <div class="field-group">
                <label for="exportCustomerFilter">
                  Cliente:
                </label>
                <select id="exportCustomerFilter" class="field-element modern-select">
                  <option value="">Todos los clientes</option>
                </select>
              </div>
            </div>
            
            <div class="filters-grid">
              <div class="field-group">
                <label for="exportDateFrom">
                 Fecha desde:
                </label>
                <input type="date" id="exportDateFrom" class="field-element modern-input">
              </div>
              
              <div class="field-group">
                <label for="exportDateTo">
                  Fecha hasta:
                </label>
                <input type="date" id="exportDateTo" class="field-element modern-input">
              </div>
              
              <div class="field-group">
                <label for="exportStatusFilter">
                  Estado:
                </label>
                <select id="exportStatusFilter" class="field-element modern-select">
                  <option value="">Todos los estados</option>
                  <option value="processing">Procesando</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="export-preview">
            <h4>Vista Previa</h4>
            <p id="exportPreviewText">
              Seleccione los filtros para ver la cantidad de registros a exportar
            </p>
          </div>
        </div>
        
        <div class="custom-modal-footer">
          <div class="export-buttons">
            <button type="button" class="add-button cancel-button" onclick="closeExportModal()">
              Cancelar
            </button>
            <button type="button" class="add-button pdf-button" onclick="executeExport('pdf')">
              Exportar PDF
            </button>
            <button type="button" class="add-button excel-button" onclick="executeExport('excel')">
              Exportar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remover modal existente si existe
  const existingModal = document.getElementById('exportModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Cargar clientes en el select
  const customerSelect = document.getElementById('exportCustomerFilter');
  if (customerSelect && customerIdToNameMap) {
    Object.entries(customerIdToNameMap).forEach(([id, name]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      customerSelect.appendChild(option);
    });
  }
  
  // Agregar event listeners para actualizar el preview
  const filterInputs = ['exportSearchTerm', 'exportDateFrom', 'exportDateTo', 'exportCustomerFilter', 'exportStatusFilter'];
  filterInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('change', updateExportPreview);
      input.addEventListener('keyup', updateExportPreview);
    }
  });
  
  document.getElementById('exportModal').style.display = 'flex';
  updateExportPreview();
}

function updateExportPreview() {
  const filters = getExportFilters();
  const filteredSales = getFilteredSalesData(
    filters.searchTerm,
    filters.dateFrom,
    filters.dateTo,
    filters.customerFilter,
    filters.statusFilter
  );
  
  const previewText = document.getElementById('exportPreviewText');
  if (previewText) {
    const total = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const completedCount = filteredSales.filter(s => (s.status || s.estado || 'processing') === 'completed').length;
    const processingCount = filteredSales.filter(s => (s.status || s.estado || 'processing') === 'processing').length;
    const cancelledCount = filteredSales.filter(s => (s.status || s.estado || 'processing') === 'cancelled').length;
    
    previewText.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; text-align: center;">
        <div>
          <div style="font-size: 24px; font-weight: bold;">${filteredSales.length}</div>
          <div style="font-size: 12px; opacity: 0.8;">Ventas encontradas</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">${formatCurrency(total)}</div>
          <div style="font-size: 12px; opacity: 0.8;">Total general</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${completedCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">Completadas</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${cancelledCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">Canceladas</div>
        </div>
      </div>
    `;
  }
}

function getExportFilters() {
  return {
    searchTerm: document.getElementById('exportSearchTerm')?.value || '',
    dateFrom: document.getElementById('exportDateFrom')?.value || '',
    dateTo: document.getElementById('exportDateTo')?.value || '',
    customerFilter: document.getElementById('exportCustomerFilter')?.value || '',
    statusFilter: document.getElementById('exportStatusFilter')?.value || ''
  };
}

function executeExport(type) {
  const filters = getExportFilters();
  
  if (type === 'pdf') {
    exportToPDF(filters);
  } else if (type === 'excel') {
    exportToExcel(filters);
  }
  
  closeExportModal();
}

function closeExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

// ===== FUNCIONES GLOBALES =====
window.showExportModal = showExportModal;
window.closeExportModal = closeExportModal;
window.executeExport = executeExport;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;

// Agregar estilos al documento
if (!document.getElementById('export-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'export-styles';
  styleElement.innerHTML = exportStyles;
  document.head.appendChild(styleElement);
}