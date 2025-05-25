// ===== MÓDULO DE EXPORTACIONES PARA COMPRAS =====

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

// Función para obtener datos de compras con filtros
function getFilteredPurchasesData(searchTerm = '', dateFrom = '', dateTo = '', providerFilter = '', statusFilter = '') {
  let filteredPurchases = [...originalPurchases];

  // Filtro por término de búsqueda
  if (searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    filteredPurchases = filteredPurchases.filter(p => {
      const providerMatch = 
        (p.provider?.company && p.provider.company.toLowerCase().includes(term)) ||
        (p.proveedor?.company && p.proveedor.company.toLowerCase().includes(term)) ||
        (typeof p.provider === 'string' && providerIdToNameMap[p.provider] && providerIdToNameMap[p.provider].toLowerCase().includes(term)) ||
        (typeof p.proveedor === 'string' && providerIdToNameMap[p.proveedor] && providerIdToNameMap[p.proveedor].toLowerCase().includes(term));
      
      const productsMatch = 
        (p.products && Array.isArray(p.products) && p.products.some(item => {
          if (item.product?.name) {
            return item.product.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.product]) {
            return productIdToNameMap[item.product].toLowerCase().includes(term);
          }
          return false;
        })) ||
        (p.productos && Array.isArray(p.productos) && p.productos.some(item => {
          if (item.producto?.name) {
            return item.producto.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.producto]) {
            return productIdToNameMap[item.producto].toLowerCase().includes(term);
          }
          return false;
        }));
      
      return providerMatch || productsMatch || (p.id && p.id.toLowerCase().includes(term));
    });
  }

  // Filtro por rango de fechas
  if (dateFrom || dateTo) {
    filteredPurchases = filteredPurchases.filter(p => {
      const purchaseDate = new Date(p.purchase_date || p.fecha_compra || p.purchaseDate);
      if (isNaN(purchaseDate.getTime())) return false;
      
      if (dateFrom && purchaseDate < new Date(dateFrom)) return false;
      if (dateTo && purchaseDate > new Date(dateTo)) return false;
      
      return true;
    });
  }

  // Filtro por proveedor
  if (providerFilter) {
    filteredPurchases = filteredPurchases.filter(p => {
      const providerId = p.provider?._id || p.provider || p.proveedor?._id || p.proveedor;
      return providerId === providerFilter;
    });
  }

  // Filtro por estado
  if (statusFilter) {
    filteredPurchases = filteredPurchases.filter(p => {
      const status = p.status || p.estado || 'active';
      return status === statusFilter;
    });
  }

  return filteredPurchases;
}

// Función para preparar datos para exportación
function prepareExportData(purchases) {
  return purchases.map((purchase, index) => {
    const purchaseId = purchase._id || "";
    const displayId = purchase.id || purchaseId || `Pu${String(index + 1).padStart(2, '0')}`;
    
    let providerName = "Sin Proveedor";
    if (purchase.provider) {
      if (typeof purchase.provider === 'object' && purchase.provider.company) {
        providerName = purchase.provider.company;
      } else {
        providerName = getProviderNameById(purchase.provider);
      }
    } else if (purchase.proveedor) {
      if (typeof purchase.proveedor === 'object' && purchase.proveedor.company) {
        providerName = purchase.proveedor.company;
      } else {
        providerName = getProviderNameById(purchase.proveedor);
      }
    }
    
    const purchaseDate = purchase.purchase_date || purchase.fecha_compra || purchase.purchaseDate;
    const status = purchase.status || purchase.estado || "active";
    const total = purchase.total || 0;
    
    // Obtener productos
    let products = [];
    if (purchase.products && Array.isArray(purchase.products)) {
      products = purchase.products;
    } else if (purchase.productos && Array.isArray(purchase.productos)) {
      products = purchase.productos.map(item => ({
        product: item.producto,
        quantity: item.cantidad,
        purchase_price: item.precio_compra,
        total: item.total
      }));
    }
    
    const productsList = products.map(item => {
      const productName = item.product?.name || getProductNameById(item.product?._id || item.product);
      return `${productName} (${item.quantity} × ${formatCurrency(item.purchase_price)})`;
    }).join('; ');
    
    return {
      id: displayId,
      proveedor: providerName,
      fecha: formatDate(purchaseDate),
      productos: productsList,
      total: total,
      totalFormatted: formatCurrency(total),
      estado: status === 'active' ? 'Activo' : 'Inactivo',
      rawDate: purchaseDate,
      productCount: products.length
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
    const filteredPurchases = getFilteredPurchasesData(
      filters.searchTerm,
      filters.dateFrom,
      filters.dateTo,
      filters.providerFilter,
      filters.statusFilter
    );
    
    const exportData = prepareExportData(filteredPurchases);
    
    // Configuración del documento
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;
    
    // Encabezado profesional
        doc.setFillColor(27, 43, 64);
        doc.rect(0, 0, pageWidth, 30, 'F');

        doc.addImage('./assets/icesoft.png', 'PNG', 5, 5, 20, 20);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('REPORTE DE COMPRAS', 30, 20);
        yPosition = 45;
        doc.setTextColor(0, 0, 0);

        // Fecha y hora
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(10);
        const now = new Date();
        doc.text(`Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`, 
                pageWidth - margin, 20, { align: 'right' });

        yPosition = 50;
    doc.setTextColor(0, 0, 0); // Volver a negro
    
    // Filtros aplicados
    if (filters.searchTerm || filters.dateFrom || filters.dateTo || filters.providerFilter || filters.statusFilter) {
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
      if (filters.providerFilter) {
        const providerName = getProviderNameById(filters.providerFilter) || 'Proveedor no encontrado';
        doc.text(`• Proveedor: ${providerName}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (filters.statusFilter) {
        doc.text(`• Estado: ${filters.statusFilter === 'active' ? 'Activo' : 'Inactivo'}`, margin + 5, yPosition);
        yPosition += 8;
      }
      yPosition += 10;
    }
    
    // Resumen estadístico
    const totalAmount = exportData.reduce((sum, item) => sum + (item.total || 0), 0);
    const activeCount = exportData.filter(item => item.estado === 'Activo').length;
    const inactiveCount = exportData.length - activeCount;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN ESTADÍSTICO', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Compras activas: ${activeCount}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Compras inactivas: ${inactiveCount}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total general: ${formatCurrency(totalAmount)}`, margin, yPosition);
    yPosition += 25;
    
    // Tabla principal de compras
    if (exportData.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE COMPRAS', margin, yPosition);
      yPosition += 15;
      
      // Preparar datos para la tabla
      const tableData = exportData.map((purchase) => [
        purchase.id || '',
        purchase.proveedor || '',
        purchase.fecha || '',
        purchase.productCount.toString(),
        purchase.totalFormatted || '',
        purchase.estado || ''
      ]);
      
      // Usar autoTable con verificación
      if (doc.autoTable) {
        doc.autoTable({
          startY: yPosition,
          head: [['ID', 'Proveedor', 'Fecha', 'Productos', 'Total', 'Estado']],
          body: tableData,
          theme: 'striped',
          styles: {
            fontSize: 9,
            font: 'helvetica',
            cellPadding: 3
          },
          headStyles: {
            fillColor: [27, 43, 64],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 40 },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 30, halign: 'right' },
            6: { cellWidth: 20, halign: 'center' }
          },
          margin: { left: margin, right: margin },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      } else {
        // Fallback: mostrar datos sin tabla
        exportData.slice(0, 10).forEach((purchase, index) => {
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = margin;
          }
          doc.setFontSize(8);
          doc.text(`${purchase.id} - ${purchase.proveedor} - ${purchase.totalFormatted}`, margin, yPosition);
          yPosition += 6;
        });
        if (exportData.length > 10) {
          doc.text(`... y ${exportData.length - 10} compras más`, margin, yPosition);
        }
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.text('No se encontraron compras con los filtros aplicados.', margin, yPosition);
    }
    
    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Línea superior del pie
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      // Información del pie
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const footerY = pageHeight - 15;
      doc.text('ICESOFT ', margin, footerY);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      
      // Fecha en el pie
      doc.setFontSize(7);
      doc.text(new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }), pageWidth / 2, footerY, { align: 'center' });
    }
    
    // GUARDAR ARCHIVO
    const fileName = `Compras_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    hideLoadingIndicator();
    showSuccess(`PDF generado exitosamente: ${fileName}`);
    
  } catch (error) {
    hideLoadingIndicator();
    showError(`Error al generar PDF: ${error.message}`);
  }
}

// ===== EXPORTACIÓN A EXCEL MEJORADA =====
async function exportToExcel(filters = {}) {
  try {
    showLoadingIndicator();
    await loadExportLibraries();
    
    // Obtener datos filtrados
    const filteredPurchases = getFilteredPurchasesData(
      filters.searchTerm,
      filters.dateFrom,
      filters.dateTo,
      filters.providerFilter,
      filters.statusFilter
    );
    
    const exportData = prepareExportData(filteredPurchases);
    
    // Crear nuevo workbook
    const wb = XLSX.utils.book_new();
    
    // ===== HOJA 1: RESUMEN EJECUTIVO =====
    const currentDate = new Date();
    const summaryData = [
      ['REPORTE DE COMPRAS - RESUMEN EJECUTIVO'],
      [''],
      ['INFORMACIÓN GENERAL'],
      ['Sistema:', 'ICESOFT - Gestión Empresarial'],
      ['Fecha de generación:', currentDate.toLocaleDateString('es-ES')],
      ['Hora de generación:', currentDate.toLocaleTimeString('es-ES')],
      ['Total de registros:', exportData.length],
      [''],
      ['FILTROS APLICADOS']
    ];
    
    if (filters.searchTerm) summaryData.push(['Búsqueda:', filters.searchTerm]);
    if (filters.dateFrom || filters.dateTo) {
      const dateRange = `${filters.dateFrom || 'Sin límite'} - ${filters.dateTo || 'Sin límite'}`;
      summaryData.push(['Rango de fechas:', dateRange]);
    }
    if (filters.providerFilter) {
      summaryData.push(['Proveedor:', getProviderNameById(filters.providerFilter)]);
    }
    if (filters.statusFilter) {
      summaryData.push(['Estado:', filters.statusFilter === 'active' ? 'Activo' : 'Inactivo']);
    }
    
    // Estadísticas
    const totalAmount = exportData.reduce((sum, item) => sum + item.total, 0);
    const activeCount = exportData.filter(item => item.estado === 'Activo').length;
    const inactiveCount = exportData.length - activeCount;
    
    summaryData.push(
      [''],
      ['RESUMEN FINANCIERO'],
      ['Total general:', totalAmount],
      ['Promedio por compra:', totalAmount / (exportData.length || 1)],
      [''],
      ['ESTADÍSTICAS'],
      ['Compras activas:', activeCount],
      ['Compras inactivas:', inactiveCount],
      ['Porcentaje activas:', `${((activeCount / exportData.length) * 100).toFixed(1)}%`]
    );
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Aplicar estilos al resumen
    summaryWs['!cols'] = [{ width: 25 }, { width: 35 }];
    
    // Formatear celdas especiales
    if (summaryWs['A1']) {
      summaryWs['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: "2980B9" } },
        alignment: { horizontal: "center" }
      };
    }
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Ejecutivo');
    
    // ===== HOJA 2: DATOS PRINCIPALES =====
    if (exportData.length > 0) {
      // Encabezado de la tabla
      const headers = [
        'ID Compra',
        'Proveedor',
        'Fecha',
        'Productos',
        'Cant. Productos',
        'Total',
        'Estado',
        'Observaciones'
      ];
      
      const detailData = exportData.map(purchase => ({
        'ID Compra': purchase.id,
        'Proveedor': purchase.proveedor,
        'Fecha': purchase.fecha,
        'Productos': purchase.productos,
        'Cant. Productos': purchase.productCount,
        'Total': purchase.total,
        'Estado': purchase.estado,
        'Observaciones': purchase.estado === 'Activo' ? 'Compra en estado normal' : 'Requiere revisión'
      }));
      
      const detailWs = XLSX.utils.json_to_sheet(detailData);
      
      // Configurar ancho de columnas
      detailWs['!cols'] = [
        { width: 15 }, // ID
        { width: 30 }, // Proveedor
        { width: 15 }, // Fecha
        { width: 60 }, // Productos
        { width: 18 }, // Cantidad
        { width: 18 }, // Total
        { width: 12 }, // Estado
        { width: 25 }  // Observaciones
      ];
      
      // Aplicar formato a los encabezados
      const headerRange = XLSX.utils.decode_range(detailWs['!ref']);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (detailWs[cellAddress]) {
          detailWs[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2980B9" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
      
      XLSX.utils.book_append_sheet(wb, detailWs, 'Datos Principales');
    }
    
    // ===== HOJA 3: ANÁLISIS POR PROVEEDOR =====
    if (exportData.length > 0) {
      const providerStats = {};
      
      exportData.forEach(purchase => {
        const provider = purchase.proveedor;
        if (!providerStats[provider]) {
          providerStats[provider] = {
            totalCompras: 0,
            montoTotal: 0,
            comprasActivas: 0,
            comprasInactivas: 0,
            productos: new Set()
          };
        }
        
        providerStats[provider].totalCompras++;
        providerStats[provider].montoTotal += purchase.total;
        providerStats[provider].productos.add(purchase.productCount);
        
        if (purchase.estado === 'Activo') {
          providerStats[provider].comprasActivas++;
        } else {
          providerStats[provider].comprasInactivas++;
        }
      });
      
      const providerAnalysis = Object.entries(providerStats).map(([provider, stats]) => ({
        'Proveedor': provider,
        'Total Compras': stats.totalCompras,
        'Monto Total': stats.montoTotal,
        'Compras Activas': stats.comprasActivas,
        'Compras Inactivas': stats.comprasInactivas,
        'Promedio/Compra': Math.round(stats.montoTotal / stats.totalCompras),
        '% Participación': `${((stats.montoTotal / totalAmount) * 100).toFixed(1)}%`,
        'Calificación': stats.comprasActivas > stats.comprasInactivas ? 'Excelente' : 'Regular'
      }));
      
      // Ordenar por monto total descendente
      providerAnalysis.sort((a, b) => b['Monto Total'] - a['Monto Total']);
      
      const providerWs = XLSX.utils.json_to_sheet(providerAnalysis);
      providerWs['!cols'] = [
        { width: 30 }, // Proveedor
        { width: 15 }, // Total Compras
        { width: 18 }, // Monto Total
        { width: 16 }, // Activas
        { width: 16 }, // Inactivas
        { width: 18 }, // Promedio
        { width: 16 }, // Participación
        { width: 15 }  // Calificación
      ];
      
      // Aplicar formato a los encabezados
      const headerRange = XLSX.utils.decode_range(providerWs['!ref']);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (providerWs[cellAddress]) {
          providerWs[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "27AE60" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
      
      XLSX.utils.book_append_sheet(wb, providerWs, 'Análisis Proveedores');
    }
    
    // ===== HOJA 4: TENDENCIAS TEMPORALES =====
    if (exportData.length > 0) {
      const monthlyStats = {};
      
      exportData.forEach(purchase => {
        const date = new Date(purchase.rawDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            compras: 0,
            total: 0,
            activas: 0
          };
        }
        
        monthlyStats[monthKey].compras++;
        monthlyStats[monthKey].total += purchase.total;
        if (purchase.estado === 'Activo') {
          monthlyStats[monthKey].activas++;
        }
      });
      
      const trendsData = Object.entries(monthlyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, stats]) => ({
          'Mes': month,
          'Compras': stats.compras,
          'Total': stats.total,
          'Activas': stats.activas,
          'Promedio': Math.round(stats.total / stats.compras),
          'Tendencia': stats.compras > 5 ? 'Alta' : stats.compras > 2 ? 'Media' : 'Baja'
        }));
      
      const trendsWs = XLSX.utils.json_to_sheet(trendsData);
      trendsWs['!cols'] = [
        { width: 15 }, // Mes
        { width: 12 }, // Compras
        { width: 18 }, // Total
        { width: 12 }, // Activas
        { width: 15 }, // Promedio
        { width: 15 }  // Tendencia
      ];
      
      XLSX.utils.book_append_sheet(wb, trendsWs, 'Tendencias Temporales');
    }
    
    // Guardar el archivo
    const fileName = `compras_reporte_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    hideLoadingIndicator();
    showSuccess('Archivo Excel generado exitosamente con formato profesional');
    
  } catch (error) {
    hideLoadingIndicator();
    showError('Error al generar Excel: ' + error.message);
  }
}

// ===== MODAL DE FILTROS PARA EXPORTACIÓN MEJORADO =====
function showExportModal() {
  const modalHtml = `
    <div id="exportModal" class="custom-modal">
      <div class="custom-modal-content">
        <div class="custom-modal-header">
          <h3 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 24px; font-weight: 600;">Exportar compras</h3>
          <button class="modal-close" onclick="closeExportModal()">&times;</button>
        </div>
        
        <div class="custom-modal-body">
          <div class="export-filters">
            <div class="filters-grid">
              <div class="field-group">
                <label for="exportProviderFilter">
                  Proveedor:
                </label>
                <select id="exportProviderFilter" class="field-element modern-select">
                  <option value="">Todos los proveedores</option>
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
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
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
            <button type="button" class="add-button" onclick="closeExportModal()">
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
  
  // Cargar proveedores en el select
  const providerSelect = document.getElementById('exportProviderFilter');
  if (providerSelect && providerIdToNameMap) {
    Object.entries(providerIdToNameMap).forEach(([id, name]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      providerSelect.appendChild(option);
    });
  }
  
  // Agregar event listeners para actualizar el preview
  const filterInputs = ['exportSearchTerm', 'exportDateFrom', 'exportDateTo', 'exportProviderFilter', 'exportStatusFilter'];
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
  const filteredPurchases = getFilteredPurchasesData(
    filters.searchTerm,
    filters.dateFrom,
    filters.dateTo,
    filters.providerFilter,
    filters.statusFilter
  );
  
  const previewText = document.getElementById('exportPreviewText');
  if (previewText) {
    const total = filteredPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const activeCount = filteredPurchases.filter(p => (p.status || p.estado || 'active') === 'active').length;
    
    previewText.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; text-align: center;">
        <div>
          <div style="font-size: 24px; font-weight: bold;">${filteredPurchases.length}</div>
          <div style="font-size: 12px; opacity: 0.8;">Compras encontradas</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">${formatCurrency(total)}</div>
          <div style="font-size: 12px; opacity: 0.8;">Total general</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${activeCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">Compras activas</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${filteredPurchases.length - activeCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">Compras inactivas</div>
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
    providerFilter: document.getElementById('exportProviderFilter')?.value || '',
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