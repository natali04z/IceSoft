// ===== MÓDULO DE EXPORTACIONES PARA CLIENTES - VERSIÓN PDF COMPLETA =====

function loadExportLibraries() {
  return new Promise((resolve, reject) => {
    function loadJsPDF() {
      return new Promise((resolveJsPDF, rejectJsPDF) => {
        if (window.jsPDF) {
          resolveJsPDF();
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js';
        script.onload = () => {
          setTimeout(() => {
            if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
              resolveJsPDF();
            } else {
              rejectJsPDF(new Error('jsPDF no se inicializó'));
            }
          }, 100);
        };
        script.onerror = () => rejectJsPDF(new Error('Error al descargar jsPDF'));
        document.head.appendChild(script);
      });
    }
    
    function loadAutoTable() {
      return new Promise((resolveAutoTable, rejectAutoTable) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/jspdf-autotable@3.5.31/dist/jspdf.plugin.autotable.min.js';
        script.onload = () => {
          setTimeout(() => {
            const jsPDF = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
            if (jsPDF && jsPDF.API && jsPDF.API.autoTable) {
              resolveAutoTable();
            } else {
              rejectAutoTable(new Error('AutoTable no se inicializó'));
            }
          }, 200);
        };
        script.onerror = () => rejectAutoTable(new Error('Error al descargar AutoTable'));
        document.head.appendChild(script);
      });
    }
    
    loadJsPDF()
      .then(() => loadAutoTable())
      .then(() => resolve())
      .catch((error) => reject(error));
  });
}

function getFilteredCustomersData(searchTerm = '', dateFrom = '', dateTo = '', statusFilter = '') {
  let sourceCustomers = [];
  
  if (window.originalCustomers && Array.isArray(window.originalCustomers)) {
    sourceCustomers = window.originalCustomers;
  } else if (window.allCustomers && Array.isArray(window.allCustomers)) {
    sourceCustomers = window.allCustomers;
  } else {
    const tableBody = document.getElementById('customerTableBody');
    if (tableBody) {
      sourceCustomers = extractCustomersFromDOM();
    }
  }

  if (sourceCustomers.length === 0) {
    return [];
  }

  let filteredCustomers = [...sourceCustomers];

  if (searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    filteredCustomers = filteredCustomers.filter(c => {
      const nameMatch = c.name && c.name.toLowerCase().includes(term);
      const lastnameMatch = c.lastname && c.lastname.toLowerCase().includes(term);
      const emailMatch = c.email && c.email.toLowerCase().includes(term);
      const phoneMatch = c.phone && c.phone.toLowerCase().includes(term);
      const idMatch = (c.id || c._id) && (c.id || c._id).toLowerCase().includes(term);
      
      return nameMatch || lastnameMatch || emailMatch || phoneMatch || idMatch;
    });
  }

  if (dateFrom || dateTo) {
    filteredCustomers = filteredCustomers.filter(c => {
      let customerDate = null;
      const rawDate = c.createdAt || c.created_at || c.fechaCreacion;
      
      if (!rawDate) return false;
      
      try {
        // Si viene en formato YYYY-MM-DD, parsearlo correctamente
        if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          const [year, month, day] = rawDate.split('-').map(Number);
          customerDate = new Date(year, month - 1, day);
        } else {
          customerDate = new Date(rawDate);
        }
        
        if (isNaN(customerDate.getTime())) return false;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (customerDate < fromDate) return false;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          if (customerDate > toDate) return false;
        }
        
        return true;
      } catch (e) {
        console.warn('Error al procesar fecha del cliente:', rawDate, e);
        return false;
      }
    });
  }

  if (statusFilter) {
    filteredCustomers = filteredCustomers.filter(c => {
      const status = c.status || 'active';
      return status === statusFilter;
    });
  }

  return filteredCustomers;
}

function extractCustomersFromDOM() {
  const customers = [];
  const tableBody = document.getElementById('customerTableBody');
  
  if (!tableBody) return customers;
  
  const rows = tableBody.querySelectorAll('tr[data-customerid]');
  
  rows.forEach((row, index) => {
    try {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 6) {
        const dateText = cells[4].textContent.trim();
        
        const customer = {
          id: row.getAttribute('data-customerid') || `Cliente_${index + 1}`,
          name: cells[0].textContent.replace('Predeterminado', '').trim(),
          lastname: cells[1].textContent.trim(),
          phone: cells[2].textContent.trim(),
          email: cells[3].textContent.trim(),
          createdAt: dateText,
          status: cells[5].querySelector('input[type="checkbox"]')?.checked ? 'active' : 'inactive',
          isDefault: cells[0].textContent.includes('Predeterminado')
        };
        customers.push(customer);
      }
    } catch (error) {
      // Error silencioso
    }
  });
  
  return customers;
}

function prepareCustomersExportData(customers) {
  return customers.map((customer, index) => {
    const customerId = customer._id || customer.id || "";
    const displayId = customer.id || customerId || `Cl${String(index + 1).padStart(2, '0')}`;
    
    const status = customer.status || "active";
    const createdDate = customer.createdAt || customer.created_at || customer.fechaCreacion;
    
    const statusTranslation = {
      'active': 'Activo',
      'inactive': 'Inactivo'
    };
    
    const formatDateFunc = function(date) {
      if (!date) return "Fecha no disponible";
      
      try {
        // Si ya está en formato DD/MM/YYYY, devolverlo tal como está
        if (typeof date === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
          return date;
        }
        
        // Si es "Invalid Date" o fecha no disponible, devolverlo
        if (typeof date === 'string' && (date === "Fecha no disponible" || date === "Invalid Date" || date.toLowerCase().includes('invalid'))) {
          return "Fecha no disponible";
        }
        
        // Si viene en formato YYYY-MM-DD, parsearlo correctamente
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          const [year, month, day] = date.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString('es-CO');
          }
        }
        
        // Si viene en formato ISO completo (YYYY-MM-DDTHH:MM:SS.sssZ)
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(date)) {
          const dateObj = new Date(date);
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString('es-CO');
          }
        }
        
        // Si es un objeto Date válido
        if (date instanceof Date && !isNaN(date.getTime())) {
          return date.toLocaleDateString('es-CO');
        }
        
        // Intentar parsear como Date genérico
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString('es-CO');
        }
        
        // Si todo falla, devolver el string o fecha no disponible
        return "Fecha no disponible";
        
      } catch (e) {
        console.warn('Error al formatear fecha:', date, e);
        return "Fecha no disponible";
      }
    };
    
    return {
      id: displayId,
      nombre: customer.name || '',
      apellido: customer.lastname || '',
      telefono: customer.phone || '',
      email: customer.email || '',
      fechaCreacion: formatDateFunc(createdDate),
      estado: statusTranslation[status] || status,
      isDefault: customer.isDefault || false,
      rawDate: createdDate
    };
  });
}

async function exportCustomersToPDF(filters = {}, selectedCustomers = []) {
  try {
    const showLoadingFunc = window.showLoadingIndicator || function() {
      const loader = document.createElement('div');
      loader.id = 'exportLoadingIndicator';
      loader.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; justify-content: center;
        align-items: center; z-index: 9999;
      `;
      loader.innerHTML = '<div style="background: white; padding: 20px; border-radius: 5px; font-family: Arial, sans-serif;">Generando PDF...</div>';
      document.body.appendChild(loader);
    };
    
    const hideLoadingFunc = window.hideLoadingIndicator || function() {
      const loader = document.getElementById('exportLoadingIndicator');
      if (loader) loader.remove();
    };
    
    const showSuccessFunc = window.showSuccess || function(message) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'success', title: 'Éxito', text: message, timer: 3000 });
      } else {
        alert('Éxito: ' + message);
      }
    };
    
    const showErrorFunc = window.showError || function(message) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'Error', text: message });
      } else {
        alert('Error: ' + message);
      }
    };
    
    showLoadingFunc();
    
    await loadExportLibraries();
    
    let jsPDF = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
    
    if (!jsPDF) {
      throw new Error('jsPDF no pudo ser inicializado');
    }
    
    if (!window.jsPDF && jsPDF) {
      window.jsPDF = jsPDF;
    }
    
    let customersToExport = [];
    
    if (selectedCustomers.length > 0) {
      const allCustomers = getFilteredCustomersData();
      customersToExport = allCustomers.filter(c => 
        selectedCustomers.includes(c.id || c._id)
      );
    } else {
      customersToExport = getFilteredCustomersData(
        filters.searchTerm,
        filters.dateFrom,
        filters.dateTo,
        filters.statusFilter
      );
    }
    
    if (customersToExport.length === 0) {
      hideLoadingFunc();
      showErrorFunc('No hay clientes para exportar. Verifique los filtros o seleccione al menos un cliente.');
      return;
    }
    
    const exportData = prepareCustomersExportData(customersToExport);
    
    const doc = new jsPDF();
    doc.setFont('helvetica');
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;
    
    doc.setFillColor(27, 43, 64);
    doc.rect(0, 0, pageWidth, 30, 'F');

    try {
      doc.addImage('assets/icesoft.png', 'PNG', 5, 5, 20, 20);
    } catch (error) {
      // Logo no disponible
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE CLIENTES', 30, 20);
    yPosition = 45;
    doc.setTextColor(0, 0, 0);

    doc.setTextColor(240, 240, 240);
    doc.setFontSize(10);
    const now = new Date();
    doc.text(`Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`, 
            pageWidth - margin, 20, { align: 'right' });

    yPosition = 50;
    doc.setTextColor(0, 0, 0);
    
    if (selectedCustomers.length === 0 && (filters.searchTerm || filters.dateFrom || filters.dateTo || filters.statusFilter)) {
      doc.setFont('helvetica', 'bold');
      doc.text('FILTROS APLICADOS:', margin, yPosition);
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      
      if (filters.dateFrom || filters.dateTo) {
        const dateRange = `${filters.dateFrom || 'Sin límite'} hasta ${filters.dateTo || 'Sin límite'}`;
        doc.text(`• Rango de fechas: ${dateRange}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (filters.statusFilter) {
        const statusNames = {
          'active': 'Activo', 
          'inactive': 'Inactivo'
        };
        doc.text(`• Estado: ${statusNames[filters.statusFilter] || filters.statusFilter}`, margin + 5, yPosition);
        yPosition += 8;
      }
      yPosition += 10;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE CLIENTES', margin, yPosition);
    yPosition += 15;
    
    const tableData = exportData.map((customer) => {
      const defaultBadge = customer.isDefault ? ' (Predeterminado)' : '';
      return [
        (customer.nombre || '') + defaultBadge,
        customer.apellido || '',
        customer.telefono || '',
        customer.email || '',
        customer.fechaCreacion || '',
        customer.estado || ''
      ];
    });
    
    doc.autoTable({
      startY: yPosition,
      head: [['Nombre', 'Apellido', 'Teléfono', 'Correo', 'Fecha Creación', 'Estado']],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 9,
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
        fontSize: 10,
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 32, halign: 'left', valign: 'middle' },   // Nombre (reducido)
        1: { cellWidth: 35, halign: 'left', valign: 'middle' },   // Apellido (aumentado)
        2: { cellWidth: 30, halign: 'center', valign: 'middle' }, // Teléfono (reducido)
        3: { cellWidth: 55, halign: 'left', valign: 'middle' },   // Correo (aumentado)
        4: { cellWidth: 24, halign: 'center', valign: 'middle' }, // Fecha (reducido)
        5: { cellWidth: 20, halign: 'center', valign: 'middle' }  // Estado (reducido)
        }, 
      margin: { 
        left: (pageWidth - 196) / 2,
        right: (pageWidth - 196) / 2
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      didParseCell: function(data) {
        if (data.row.index >= 0 && data.column.index === 0) {
          const cellText = data.cell.text.join(' ');
          if (cellText.includes('(Predeterminado)')) {
            data.cell.styles.fillColor = [255, 248, 220];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
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
      doc.text('ICESOFT ', margin, footerY);
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
    
    const exportType = selectedCustomers.length > 0 ? 'Seleccionados' : 'Filtrados';
    const fileName = `Clientes_${exportType}_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    hideLoadingFunc();
    showSuccessFunc(`PDF generado exitosamente: ${fileName}`);
    
  } catch (error) {
    const hideLoadingFunc = window.hideLoadingIndicator || function() {
      const loader = document.getElementById('exportLoadingIndicator');
      if (loader) loader.remove();
    };
    
    const showErrorFunc = window.showError || function(message) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'Error', text: message });
      } else {
        alert('Error: ' + message);
      }
    };
    
    hideLoadingFunc();
    showErrorFunc(`Error al generar PDF: ${error.message}`);
  }
}

function showCustomersExportModal() {
  const customers = getFilteredCustomersData();
  
  const modalHtml = `
    <div id="customersExportModal" class="custom-modal">
      <div class="custom-modal-content">
        <div class="custom-modal-header">
          <h3 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 24px; font-weight: 600;">Exportar clientes</h3>
          <button class="modal-close" onclick="closeCustomersExportModal()">&times;</button>
        </div>
        
        <div class="custom-modal-body">
          <div class="export-options">
            <h4>Opciones de exportación:</h4>
            <div class="option-buttons">
              <button type="button" class="option-btn" onclick="showExportByFilters()">
                <i class="material-icons">filter_list</i>
                Exportar con filtros
              </button>
              <button type="button" class="option-btn" onclick="showExportBySelection()">
                <i class="material-icons">checklist</i>
                Seleccionar clientes específicos
              </button>
            </div>
          </div>
          
          <div id="filters-panel" class="export-panel" style="display: none;">
            <h4>Filtros de exportación:</h4>
            <div class="filters-grid">

            </div>
            
            <div class="filters-grid">
              <div class="field-group">
                <label for="exportCustomersDateFrom">Fecha desde:</label>
                <input type="date" id="exportCustomersDateFrom" class="field-element modern-input">
              </div>
              
              <div class="field-group">
                <label for="exportCustomersDateTo">Fecha hasta:</label>
                <input type="date" id="exportCustomersDateTo" class="field-element modern-input">
              </div>
              
              <div class="field-group">
                <label for="exportCustomersStatusFilter">Estado:</label>
                <select id="exportCustomersStatusFilter" class="field-element modern-select">
                  <option value="">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
            
            <div class="export-preview">
              <h4>Vista Previa</h4>
              <p id="customersExportPreviewText">Seleccione los filtros para ver la cantidad de registros a exportar</p>
            </div>
          </div>
          
          <div id="selection-panel" class="export-panel" style="display: none;">
            <h4>Seleccionar clientes:</h4>
            <div class="selection-controls">
              <span id="selection-count">0 clientes seleccionados</span>
            </div>
            <div id="customers-list" class="customers-selection-list">
            </div>
          </div>
        </div>
        
        <div class="custom-modal-footer">
          <div class="export-buttons">
            <button type="button" class="add-button cancel-button" onclick="closeCustomersExportModal()">Cancelar</button>
            <button type="button" class="add-button pdf-button" id="export-filters-btn" onclick="executeCustomersExportByFilters()" style="display: none;">
              Exportar con filtros
            </button>
            <button type="button" class="add-button pdf-button" id="export-selected-btn" onclick="executeCustomersExportBySelection()" style="display: none;">
              Exportar seleccionados
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const existingModal = document.getElementById('customersExportModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('customersExportModal').style.display = 'flex';
  
  showExportByFilters();
}

function showExportByFilters() {
  document.getElementById('filters-panel').style.display = 'block';
  document.getElementById('selection-panel').style.display = 'none';
  document.getElementById('export-filters-btn').style.display = 'inline-flex';
  document.getElementById('export-selected-btn').style.display = 'none';
  
  document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.option-btn').classList.add('active');
  
  const filterInputs = ['exportCustomersSearchTerm', 'exportCustomersDateFrom', 'exportCustomersDateTo', 'exportCustomersStatusFilter'];
  filterInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('change', updateCustomersExportPreview);
      input.addEventListener('keyup', updateCustomersExportPreview);
    }
  });
  
  updateCustomersExportPreview();
}

function showExportBySelection() {
  document.getElementById('filters-panel').style.display = 'none';
  document.getElementById('selection-panel').style.display = 'block';
  document.getElementById('export-filters-btn').style.display = 'none';
  document.getElementById('export-selected-btn').style.display = 'inline-flex';
  
  document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.option-btn')[1].classList.add('active');
  
  loadCustomersForSelection();
}

function loadCustomersForSelection() {
  const customers = getFilteredCustomersData();
  const customersList = document.getElementById('customers-list');
  
  if (customers.length === 0) {
    customersList.innerHTML = '<p class="no-customers">No hay clientes disponibles para seleccionar.</p>';
    return;
  }
  
  let html = '<div class="customers-grid">';
  customers.forEach(customer => {
    const customerId = customer.id || customer._id;
    const displayName = `${customer.name || ''} ${customer.lastname || ''}`.trim();
    const isDefault = customer.isDefault ? ' (Predeterminado)' : '';
    
    html += `
      <div class="customer-item">
        <label class="customer-label">
          <input type="checkbox" class="customer-selection-checkbox" 
                 value="${customerId}" onchange="updateSelectionCount()">
          <div class="customer-info">
            <div class="customer-name">${displayName}${isDefault}</div>
            <div class="customer-details">${customer.email || ''}</div>
          </div>
        </label>
      </div>
    `;
  });
  html += '</div>';
  
  customersList.innerHTML = html;
  updateSelectionCount();
}

function updateSelectionCount() {
  const selectedCheckboxes = document.querySelectorAll('.customer-selection-checkbox:checked');
  const count = selectedCheckboxes.length;
  const countElement = document.getElementById('selection-count');
  
  if (countElement) {
    countElement.textContent = `${count} cliente${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}`;
  }
  
  const exportBtn = document.getElementById('export-selected-btn');
  if (exportBtn) {
    exportBtn.disabled = count === 0;
    exportBtn.style.opacity = count === 0 ? '0.5' : '1';
  }
}

function updateCustomersExportPreview() {
  const filters = getCustomersExportFilters();
  const filteredCustomers = getFilteredCustomersData(
    filters.searchTerm,
    filters.dateFrom,
    filters.dateTo,
    filters.statusFilter
  );
  
  const previewText = document.getElementById('customersExportPreviewText');
  if (previewText) {
    if (filteredCustomers.length === 0) {
      previewText.innerHTML = '<p style="color: #dc3545;">No se encontraron clientes con estos filtros</p>';
      document.getElementById('export-filters-btn').disabled = true;
      document.getElementById('export-filters-btn').style.opacity = '0.5';
    } else {
      const activeCount = filteredCustomers.filter(c => (c.status || 'active') === 'active').length;
      const inactiveCount = filteredCustomers.filter(c => (c.status || 'active') === 'inactive').length;
      const defaultCount = filteredCustomers.filter(c => c.isDefault === true).length;
      
      previewText.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold;">${filteredCustomers.length}</div>
            <div style="font-size: 12px; opacity: 0.8;">Clientes encontrados</div>
          </div>
          <div>
            <div style="font-size: 20px; font-weight: bold;">${activeCount}</div>
            <div style="font-size: 12px; opacity: 0.8;">Clientes activos</div>
          </div>
          <div>
            <div style="font-size: 20px; font-weight: bold;">${inactiveCount}</div>
            <div style="font-size: 12px; opacity: 0.8;">Clientes inactivos</div>
          </div>
          <div>
            <div style="font-size: 20px; font-weight: bold;">${defaultCount}</div>
            <div style="font-size: 12px; opacity: 0.8;">Predeterminados</div>
          </div>
        </div>
      `;
      
      document.getElementById('export-filters-btn').disabled = false;
      document.getElementById('export-filters-btn').style.opacity = '1';
    }
  }
}

function getCustomersExportFilters() {
  return {
    searchTerm: document.getElementById('exportCustomersSearchTerm')?.value || '',
    dateFrom: document.getElementById('exportCustomersDateFrom')?.value || '',
    dateTo: document.getElementById('exportCustomersDateTo')?.value || '',
    statusFilter: document.getElementById('exportCustomersStatusFilter')?.value || ''
  };
}

function executeCustomersExportByFilters() {
  const filters = getCustomersExportFilters();
  exportCustomersToPDF(filters);
  closeCustomersExportModal();
}

function executeCustomersExportBySelection() {
  const selectedCheckboxes = document.querySelectorAll('.customer-selection-checkbox:checked');
  const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
  
  if (selectedIds.length === 0) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'warning',
        title: 'Sin selección',
        text: 'Debe seleccionar al menos un cliente para exportar.'
      });
    } else {
      alert('Debe seleccionar al menos un cliente para exportar.');
    }
    return;
  }
  
  exportCustomersToPDF({}, selectedIds);
  closeCustomersExportModal();
}

function closeCustomersExportModal() {
  const modal = document.getElementById('customersExportModal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

// Funciones globales
window.showCustomersExportModal = showCustomersExportModal;
window.closeCustomersExportModal = closeCustomersExportModal;
window.executeCustomersExportByFilters = executeCustomersExportByFilters;
window.executeCustomersExportBySelection = executeCustomersExportBySelection;
window.showExportByFilters = showExportByFilters;
window.showExportBySelection = showExportBySelection;
window.updateSelectionCount = updateSelectionCount;
window.exportCustomersToPDF = exportCustomersToPDF;

// Estilos CSS
if (!document.getElementById('customers-export-styles')) {
  const styles = document.createElement('style');
  styles.id = 'customers-export-styles';
  styles.textContent = `
    .custom-modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
    }

    .custom-modal-content {
      background-color: white;
      border-radius: 10px;
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .custom-modal-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .custom-modal-body {
      padding: 20px;
    }

    .custom-modal-footer {
      padding: 20px;
      border-top: 1px solid #eee;
    }

    .export-options {
      margin-bottom: 20px;
    }

    .export-options h4 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .option-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .option-btn {
      flex: 1;
      padding: 15px;
      border: 2px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .option-btn:hover {
      border-color: #007bff;
      background-color: #f8f9fa;
    }

    .option-btn.active {
      border-color: #007bff;
      background-color: #007bff;
      color: white;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
    }

    .field-group label {
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    .modern-input, .modern-select {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
    }

    .modern-input:focus, .modern-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
    }

    .export-preview {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .export-preview h4 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .customers-selection-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 10px;
    }

    .customers-grid {
      display: grid;
      gap: 10px;
    }

    .customer-item {
      border: 1px solid #eee;
      border-radius: 5px;
      overflow: hidden;
    }

    .customer-label {
      display: flex;
      align-items: center;
      padding: 10px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .customer-label:hover {
      background-color: #f8f9fa;
    }

    .customer-selection-checkbox {
      margin-right: 10px;
    }

    .customer-info {
      flex: 1;
    }

    .customer-name {
      font-weight: 500;
      color: #333;
    }

    .customer-details {
      font-size: 12px;
      color: #666;
    }

    .selection-controls {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 15px;
    }

    .control-btn {
      padding: 5px 10px;
      border: 1px solid #ddd;
      border-radius: 3px;
      background: white;
      cursor: pointer;
      font-size: 12px;
    }

    .control-btn:hover {
      background-color: #f8f9fa;
    }

    .export-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .add-button {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.3s ease;
    }

    .cancel-button {
      background-color: #6c757d;
      color: white;
    }

    .pdf-button {
      background-color: #dc3545;
      color: white;
    }

    .cancel-button:hover {
      background-color: #5a6268;
    }

    .pdf-button:hover {
      background-color: #c82333;
    }

    .pdf-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
    }

    .modal-close:hover {
      color: #333;
    }

    .no-customers {
      text-align: center;
      padding: 20px;
      color: #666;
      font-style: italic;
    }

    #selection-count {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
  `;
  document.head.appendChild(styles);
}