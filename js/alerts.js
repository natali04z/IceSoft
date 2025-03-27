function showSuccess(message = "Operación exitosa") {
    return Swal.fire({
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 2000
    });
  }
  
  function showError(message = "Ha ocurrido un error") {
    return Swal.fire({
      icon: "error",
      title: "Error",
      text: message
    });
  }
  
  function showValidation(message = "Por favor, completa todos los campos") {
    return Swal.fire({
      icon: "warning",
      title: "Error",
      text: message
    });
  }
  
  function showInfo(message = "Información") {
    return Swal.fire({
      icon: "info",
      title: "Información",
      text: message
    });
  }
  
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