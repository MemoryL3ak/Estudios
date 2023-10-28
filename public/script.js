document.addEventListener('DOMContentLoaded', () => {
  const visitaId = document.getElementById('visitaId');
  const nombre = document.getElementById('Nombre');
  const zona = document.getElementById('Zona');
  const hospedador = document.getElementById('Hospedador');
  const hospedajesList = document.getElementById('hospedajesList');
  const asignarVisitaBtn = document.getElementById('asignarVisitaBtn');
 



  // Función para cargar las visitas iniciales al listbox y mostrar "Seleccione una visita"
  const cargarVisitas = () => {
    fetch('/visitas')
      .then((response) => response.json())
      .then((data) => {
        // Limpia las opciones anteriores, si las hubiera
        visitaId.innerHTML = '<option value="" disabled selected style="color: #888; font-style: italic;">Seleccione una visita</option>';

        data.forEach((visita) => {
          const option = document.createElement('option');
          option.value = visita.IDVisita;
          option.text = visita.Nombre;
          visitaId.appendChild(option);
        });
      })
      .catch((error) => {
        console.error(error);
        mostrarMensaje('Error al cargar las visitas', false);
      });
  };
  // Cargar visitas al iniciar la página
  cargarVisitas();


  // Maneja el evento de selección de un ID.
  visitaId.addEventListener('change', () => {
    const selectedId = visitaId.value;
    if (selectedId) {
      // Hace una solicitud al servidor para obtener los detalles de la visita seleccionada.
      fetch(`/visitas/${selectedId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) {
            const visita = data[0];
            nombre.textContent = visita.Nombre;
            zona.textContent = visita.Zona;
            hospedador.textContent = visita.Hospedador;

            // Una vez que tienes la "Zona" de la visita, obtén los hospedajes disponibles para esa "Zona".
            fetch(`/hospedajes?zona=${visita.Zona}`)
            .then((response) => response.json())
              .then((hospedajes) => {
              // Antes de llenar la lista de hospedadores, limpia las opciones anteriores
              hospedajesList.innerHTML = ''; 
              hospedajes.forEach((hospedaje) => {

               
                const radioBtn = document.createElement('input');
                radioBtn.type = 'radio';
                radioBtn.name = 'hospedaje';
                radioBtn.value = hospedaje.IDHospedaje;
                const label = document.createElement('label');
                label.textContent = `${hospedaje.Nombre} (Zona: ${hospedaje.Zona})`;
                const br = document.createElement('br');

                hospedajesList.appendChild(radioBtn);
                hospedajesList.appendChild(label);
                hospedajesList.appendChild(br);
              
              });

              })
              .catch((error) => {
                console.error(error);
                hospedajesList.innerHTML = '<p>Error al obtener los datos de hospedajes.</p>';
              });
          } else {
            nombre.textContent = '';
            zona.textContent = '';
            hospedador.textContent = '';
            hospedajesList.innerHTML = '';
          }
        })
        .catch((error) => {
          console.error(error);
          nombre.textContent = 'Error al obtener los datos';
          zona.textContent = 'Error al obtener los datos';
        });
    } else {
      nombre.textContent = '';
      zona.textContent = '';
      hospedador.textContent = '';
      hospedajesList.innerHTML = '';
    }
  });

// Botón "Asignar visita"
asignarVisitaBtn.addEventListener('click', () => {
  const selectedHospedajeId = document.querySelector('input[name="hospedaje"]:checked')?.value;
  const selectedVisitaId = visitaId.value;

  if (selectedHospedajeId && selectedVisitaId) {
    fetch(`/asignar-visita/${selectedVisitaId}/${selectedHospedajeId}`, {
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {

          // Actualiza el campo "Hospedador" con el valor asignado
          actualizarHospedador(selectedVisitaId);

          // Asignación exitosa, muestra un mensaje
          mostrarMensaje("Asignación realizada");


          // Obtiene la zona de la visita seleccionada
          fetch(`/visitas/${selectedVisitaId}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.length > 0) {
                const visita = data[0];
                const selectedZona = visita.Zona;

                // Actualiza el listado de hospedajes disponibles
                actualizarHospedajesDisponibles(selectedZona);
              }
            })

          // Actualiza la página para reflejar la asignación.
          //location.reload();
        } else {
          console.error('Error al asignar la visita.');
        }
      })
      .catch((error) => {
        console.error(error);
        console.error('Error al realizar la solicitud de asignación de visita.');
      });
  }
});
});
function mostrarMensaje(mensaje, exito) {
  const mensajeDiv = document.getElementById('mensaje');
  mensajeDiv.textContent = mensaje;

  if (exito) {
    mensajeDiv.classList.remove('error');
    mensajeDiv.classList.add('exito');
  } else {
    mensajeDiv.classList.remove('exito');
    mensajeDiv.classList.add('error');
  }

  mensajeDiv.style.display = 'block'; // Muestra el mensaje
  setTimeout(() => {
    mensajeDiv.style.display = 'none'; // Oculta el mensaje después de unos segundos
  }, 3000); // Ajusta este valor según tus preferencias
}


function actualizarHospedador(visitaId) {
  // Realiza una solicitud al servidor para obtener el Hospedador actualizado
  fetch(`/visitas/${visitaId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        const visita = data[0];
        const hospedadorSpan = document.getElementById('Hospedador');
        hospedadorSpan.textContent = visita.Hospedador;
      }
    })
    .catch((error) => {
      console.error(error);
      console.error('Error al obtener el Hospedador actualizado.');
    })};



    function actualizarHospedajesDisponibles(selectedZona) {
      // Hacer una solicitud al servidor para obtener los hospedajes disponibles
      fetch(`/hospedajes?zona=${selectedZona}`)
        .then((response) => response.json())
        .then((hospedajes) => {
          // Limpia las opciones anteriores
          hospedajesList.innerHTML = '';
    
          // Llena la lista de hospedajes disponibles
          hospedajes.forEach((hospedaje) => {
           
              const radioBtn = document.createElement('input');
              radioBtn.type = 'radio';
              radioBtn.name = 'hospedaje';
              radioBtn.value = hospedaje.IDHospedaje;
              const label = document.createElement('label');
              label.textContent = `${hospedaje.Nombre} (Zona: ${hospedaje.Zona})`;
              const br = document.createElement('br');
    
              hospedajesList.appendChild(radioBtn);
              hospedajesList.appendChild(label);
              hospedajesList.appendChild(br);
            
          });
        })
        .catch((error) => {
          console.error(error);
          hospedajesList.innerHTML = '<p>Error al obtener los datos de hospedajes.</p>';
        });
    }
    

