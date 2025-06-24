// ===== MÓDULO DE EXPORTACIONES PARA VENTAS - VERSIÓN COMPLETA MEJORADA CON SUCURSALES =====

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



    if (scriptsToLoad === 0) {
      resolve();
    }
  });
}

// Función para obtener datos de ventas con filtros actualizados con sucursales
function getFilteredSalesData(searchTerm = '', dateFrom = '', dateTo = '', customerFilter = '', branchFilter = '', statusFilter = '') {
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
      
      const branchMatch = 
        (s.branch?.name && s.branch.name.toLowerCase().includes(term)) ||
        (s.branch?.address && s.branch.address.toLowerCase().includes(term)) ||
        (typeof s.branch === 'string' && branchIdToNameMap[s.branch] && branchIdToNameMap[s.branch].toLowerCase().includes(term));
      
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
      
      return customerMatch || branchMatch || productsMatch || (s.id && s.id.toLowerCase().includes(term));
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

  // Filtro por sucursal
  if (branchFilter) {
    filteredSales = filteredSales.filter(s => {
      const branchId = s.branch?._id || s.branch;
      return branchId === branchFilter;
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

// Función para preparar datos para exportación con sucursales
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
    
    let branchName = "Sin Sucursal";
    if (sale.branch) {
      if (typeof sale.branch === 'object' && sale.branch.name) {
        branchName = sale.branch.address ? `${sale.branch.name} - ${sale.branch.address}` : sale.branch.name;
      } else {
        branchName = getBranchNameById(sale.branch);
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
    
    // Lista detallada para el PDF
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
      sucursal: branchName,
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

// ===== EXPORTACIÓN A PDF MEJORADA CON SUCURSALES =====
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
      filters.branchFilter,
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
    if (filters.searchTerm || filters.dateFrom || filters.dateTo || filters.customerFilter || filters.branchFilter || filters.statusFilter) {
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
      if (filters.branchFilter) {
        const branchName = getBranchNameById(filters.branchFilter) || 'Sucursal no encontrada';
        doc.text(`• Sucursal: ${branchName}`, margin + 5, yPosition);
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
    
    // TABLA PRINCIPAL DE VENTAS CON SUCURSAL
    if (exportData.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE VENTAS', margin, yPosition);
      yPosition += 15;
      
      // Preparar datos para la tabla incluyendo sucursal
      const tableData = exportData.map((sale) => [
        sale.id || '',
        sale.cliente || '',
        sale.sucursal || '',
        sale.fecha || '',
        sale.productos || '',
        sale.cantidad || 0,
        sale.totalFormatted || '',
        sale.estado || ''
      ]);
      
      // Configurar tabla con autoTable - COLUMNAS OPTIMIZADAS CON SUCURSAL
      doc.autoTable({
        startY: yPosition,
        head: [['ID', 'Cliente', 'Sucursal', 'Fecha', 'Productos', 'Cantidad', 'Total', 'Estado']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 7,
          font: 'helvetica',
          cellPadding: 3,
          valign: 'middle',
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [27, 43, 64],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: {
          0: { 
            cellWidth: 12, 
            halign: 'center',
            valign: 'middle'
          },
          1: { 
            cellWidth: 30, 
            halign: 'left',
            valign: 'middle'
          },
          2: { 
            cellWidth: 25, 
            halign: 'left',
            valign: 'middle'
          },
          3: { 
            cellWidth: 18, 
            halign: 'center',
            valign: 'middle'
          },
          4: { 
            cellWidth: 30, 
            halign: 'left',
            valign: 'top',
            fontSize: 6
          },
          5: { 
            cellWidth: 20, 
            halign: 'center',
            valign: 'middle'
          },
          6: { 
            cellWidth: 22, 
            halign: 'right',
            valign: 'middle'
          },
          7: { 
            cellWidth: 20, 
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
          if (data.column.index === 4 && data.cell.text && data.cell.text.length > 0) {
            const lines = data.cell.text.join(' ').split('\n');
            if (lines.length > 1) {
              data.cell.styles.minCellHeight = lines.length * 7;
            }
          }
        },
        margin: { 
          left: (pageWidth - 177) / 2,
          right: (pageWidth - 177) / 2
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
      doc.text('ICESOFT', margin, footerY);
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






// ===== MODAL DE FILTROS PARA EXPORTACIÓN MEJORADO CON SUCURSALES =====
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
              
              <div class="field-group">
                <label for="exportBranchFilter">
                  Sucursal:
                </label>
                <select id="exportBranchFilter" class="field-element modern-select">
                  <option value="">Todas las sucursales</option>
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
  
  // Cargar sucursales en el select
  const branchSelect = document.getElementById('exportBranchFilter');
  if (branchSelect && branchIdToNameMap) {
    Object.entries(branchIdToNameMap).forEach(([id, name]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      branchSelect.appendChild(option);
    });
  }
  
  // Agregar event listeners para actualizar el preview
  const filterInputs = ['exportSearchTerm', 'exportDateFrom', 'exportDateTo', 'exportCustomerFilter', 'exportBranchFilter', 'exportStatusFilter'];
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
    filters.branchFilter,
    filters.statusFilter
  );
  
  const previewText = document.getElementById('exportPreviewText');
  if (previewText) {
    const total = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const completedCount = filteredSales.filter(s => (s.status || s.estado || 'processing') === 'completed').length;
    const processingCount = filteredSales.filter(s => (s.status || s.estado || 'processing') === 'processing').length;
    const cancelledCount = filteredSales.filter(s => (s.status || s.estado || 'processing') === 'cancelled').length;
    
    // Contar sucursales únicas
    const uniqueBranches = new Set();
    filteredSales.forEach(s => {
      const branchName = s.branch?.name || getBranchNameById(s.branch) || 'Sin Sucursal';
      uniqueBranches.add(branchName);
    });
    
    previewText.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
        <div>
          <div style="font-size: 24px; font-weight: bold;">${filteredSales.length}</div>
          <div style="font-size: 12px; opacity: 0.8;">Ventas encontradas</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">${formatCurrency(total)}</div>
          <div style="font-size: 12px; opacity: 0.8;">Total general</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${uniqueBranches.size}</div>
          <div style="font-size: 12px; opacity: 0.8;">Sucursales</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${completedCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">Completadas</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${processingCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">Procesando</div>
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
    branchFilter: document.getElementById('exportBranchFilter')?.value || '',
    statusFilter: document.getElementById('exportStatusFilter')?.value || ''
  };
}

function executeExport(type) {
  const filters = getExportFilters();
  
  if (type === 'pdf') {
    exportToPDF(filters);
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