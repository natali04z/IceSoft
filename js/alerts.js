// Mostrar mensaje de éxito
function showSuccess(message = "Operación exitosa") {
  return Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  });
}

// Mostrar mensaje de error
function showError(message = "Ha ocurrido un error") {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  });
}

// Mostrar mensaje de validación
function showValidation(message = "Por favor, completa todos los campos") {
  return Swal.fire({
    icon: 'warning',
    title: 'Validación',
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  });
}

// Mostrar mensaje informativo
function showInfo(message = "Información") {
  return Swal.fire({
    icon: "info",
    title: "Información",
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  });
}

// Mostrar confirmación
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
    html: '<div class="swal2-loader-custom"></div><div class="swal2-title-custom">Cargando</div>',
    showConfirmButton: false,
    allowOutsideClick: false,
    width: '250px',
    customClass: {
      popup: 'swal-custom-loading'
    },
    showClass: {
      popup: 'swal2-show',
      backdrop: 'swal2-backdrop-show'
    },
    didOpen: () => {
      // Puedes agregar código adicional aquí si es necesario
    }
  });
}

// Función para cerrar el indicador de carga
function hideLoadingIndicator() {
  Swal.close();
}