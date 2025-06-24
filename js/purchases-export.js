// ===== MÓDULO DE EXPORTACIONES PARA COMPRAS - VERSIÓN COMPLETA MEJORADA =====

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
    
    // Crear lista de productos para PDF (sin cantidades)
    const productsList = products.map(item => {
      const productName = item.product?.name || getProductNameById(item.product?._id || item.product);
      return productName;
    }).join('\n');
    
    // Calcular cantidad total de productos
    const totalQuantity = products.reduce((sum, item) => sum + (item.quantity || 0), 0);
    

    
    const statusTranslation = {
      'active': 'Activa',
      'inactive': 'Inactiva'
    };
    
    return {
      id: displayId,
      proveedor: providerName,
      fecha: formatDate(purchaseDate),
      productos: productsList,
      cantidad: totalQuantity,
      total: total,
      totalFormatted: formatCurrency(total),
      estado: statusTranslation[status] || status,
      rawDate: purchaseDate,
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

    // Agregar logo de ICESOFT (opcional)
    try {
      doc.addImage('assets/icesoft.png', 'PNG', 5, 5, 20, 20);
    } catch (error) {
      console.warn('No se pudo cargar el logo ICESOFT:', error);
    }

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
    doc.setTextColor(0, 0, 0);
    
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
        const statusNames = {
          'active': 'Activa', 
          'inactive': 'Inactiva'
        };
        doc.text(`• Estado: ${statusNames[filters.statusFilter] || filters.statusFilter}`, margin + 5, yPosition);
        yPosition += 8;
      }
      yPosition += 10;
    }
    
    // Resumen estadístico
    const totalAmount = exportData.reduce((sum, item) => sum + (item.total || 0), 0);
    const activeCount = exportData.filter(item => item.estado === 'Activa').length;
    const inactiveCount = exportData.filter(item => item.estado === 'Inactiva').length;
    
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
    
    // TABLA PRINCIPAL DE COMPRAS
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
        purchase.productos || '',
        purchase.cantidad || 0,
        purchase.totalFormatted || '',
        purchase.estado || ''
      ]);
      
      // Configurar tabla con autoTable
      doc.autoTable({
        startY: yPosition,
        head: [['ID', 'Proveedor', 'Fecha', 'Productos', 'Cantidad', 'Total', 'Estado']],
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
            cellWidth: 30, 
            halign: 'left',
            valign: 'middle'
          },
          2: { 
            cellWidth: 27, 
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
            cellWidth: 22, 
            halign: 'center',
            valign: 'middle'
          },
          5: { 
            cellWidth: 25, 
            halign: 'right',
            valign: 'middle'
          },
          6: { 
            cellWidth: 20, 
            halign: 'center',
            valign: 'middle'
          }
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        tableWidth: 174, // Suma exacta: 15+30+27+35+22+25+20 = 174
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
          left: (pageWidth - 174) / 2,
          right: (pageWidth - 174) / 2
        }
      });
      
      yPosition = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      const noDataText = 'No se encontraron compras con los filtros aplicados.';
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
    const fileName = `Compras_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    hideLoadingIndicator();
    showSuccess(`PDF generado exitosamente: ${fileName}`);
    
  } catch (error) {
    hideLoadingIndicator();
    showError(`Error al generar PDF: ${error.message}`);
    console.error('Error completo:', error);
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
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
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
    const inactiveCount = filteredPurchases.filter(p => (p.status || p.estado || 'active') === 'inactive').length;
    
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
          <div style="font-size: 20px; font-weight: bold;">${inactiveCount}</div>
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

// Agregar estilos al documento
if (!document.getElementById('export-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'export-styles';
  styleElement.innerHTML = exportStyles;
  document.head.appendChild(styleElement);
}