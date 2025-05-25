// Mostrar mensaje de éxito
function showSuccess(message = "Operación exitosa") {
  return Swal.fire({
    icon: 'success',
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timer: 5000,
    timerProgressBar: true
  });
}

// Mostrar mensaje de error
function showError(message = "Ha ocurrido un error") {
  return Swal.fire({
    icon: 'error',
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timer: 5000,
    timerProgressBar: true
  });
}

// Mostrar mensaje de validación
function showValidation(message = "Por favor, completa todos los campos") {
  return Swal.fire({
    icon: 'warning',
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timer: 5000,
    timerProgressBar: true
  });
}

// Mostrar mensaje informativo
function showInfo(message = "Información") {
  return Swal.fire({
    icon: "info",
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timer: 5000,
    timerProgressBar: true 
  });
}

// Mostrar confirmación (sin cambios, ya tiene botones)
function showConfirm({ title = "¿Estás seguro?", text = "", confirmText = "Ok", cancelText = "Cancelar" } = {}) {
  return Swal.fire({
    title: title,
    text: text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  }).then((result) => result.isConfirmed);
}

function showLoadingIndicator() {
  Swal.fire({
    title: '',
    html: '<div class="loading-content"><div class="spinner"></div><div class="loading-text">Cargando</div></div>',
    showConfirmButton: false,
    allowOutsideClick: false,
    width: '250px',
    background: 'rgba(255, 255, 255, 0.95)',
    customClass: {
      popup: 'swal-custom-loading'
    },
    showClass: {
      popup: 'swal2-show',
      backdrop: 'swal2-backdrop-show'
    },
    didOpen: () => {
    }
  });
}

// Función para cerrar el indicador de carga
function hideLoadingIndicator() {
  Swal.close();
}