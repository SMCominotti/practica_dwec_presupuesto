import * as gesPres from "./gestionPresupuesto.js";

function mostrarDatoEnId(idElemento, valor) {
    let elemento = document.querySelector("#" + idElemento);
    if (elemento) elemento.innerHTML = valor;
}

//Manejadores:
const EditarHandle = {
    handleEvent: function(e) {
        let d = prompt("Descripción:", this.gasto.descripcion);
        let v = prompt("Valor:", this.gasto.valor);      
        let fechaStr = "";
        try {
            fechaStr = new Date(this.gasto.fecha).toISOString().substring(0, 10);
        } catch (err) { fechaStr = this.gasto.fecha; }
        
        let f = prompt("Fecha (yyyy-mm-dd):", fechaStr);
        let et = prompt("Etiquetas (separadas por comas):", this.gasto.etiquetas.join(","));
    
        if (d !== null && v !== null) {
            let valorNumerico = parseFloat(v);
            this.gasto.actualizarDescripcion(d);
            this.gasto.actualizarValor(valorNumerico);
            this.gasto.actualizarFecha(f);
            if (et !== null) this.gasto.etiquetas = et.split(",");
            repintar();
        }
    }
};

const BorrarHandle = {
    handleEvent: function(e) {
        gesPres.borrarGasto(this.gasto.id);
        repintar();
    }
};

const BorrarEtiquetasHandle = {
    handleEvent: function(e) {
        this.gasto.borrarEtiquetas(this.etiqueta);
        repintar();
    }
};

const CancelarFormularioHandle = {
    handleEvent: function(e) {
        this.formulario.remove();
        if (this.boton) {
            this.boton.disabled = false;
        }
    }
};

const GuardarEdicionHandle = {
    handleEvent: function(e) {
        e.preventDefault();
        let f = this.formulario;
        
        let descripcion = f.descripcion.value;
        let valor = parseFloat(f.valor.value);
        let fecha = f.fecha.value;
        let etiquetasTexto = f.etiquetas.value;
        
        this.gasto.actualizarDescripcion(descripcion);
        this.gasto.actualizarValor(valor);
        this.gasto.actualizarFecha(fecha);
        this.gasto.etiquetas = etiquetasTexto ? etiquetasTexto.split(",") : [];

        repintar();
        f.remove();
    }
};

const EditarHandleFormulario = {
    handleEvent: function(e) {
        let botonEditar = e.currentTarget;
        botonEditar.disabled = true;

        let plantillaFormulario = document.getElementById("formulario-template").content.cloneNode(true);
        let formulario = plantillaFormulario.querySelector("form");

        // Rellenamos el formulario con los datos del gasto
        formulario.descripcion.value = this.gasto.descripcion;
        formulario.valor.value = this.gasto.valor;
        try {
            let fechaObj = new Date(this.gasto.fecha);
            if (!isNaN(fechaObj.getTime())) {
                formulario.fecha.value = fechaObj.toISOString().substring(0, 10);
            } else {
                formulario.fecha.value = this.gasto.fecha;
            }
        } catch(err) { formulario.fecha.value = this.gasto.fecha; }
        
        formulario.etiquetas.value = this.gasto.etiquetas.join(",");

        let btnSubmit = formulario.querySelector('button[type="submit"]');
        btnSubmit.disabled = !formulario.checkValidity();
        formulario.addEventListener("input", function() {
            btnSubmit.disabled = !formulario.checkValidity();
        });
        
        let handleGuardar = Object.create(GuardarEdicionHandle);
        handleGuardar.gasto = this.gasto;
        handleGuardar.formulario = formulario;
        formulario.addEventListener("submit", handleGuardar);

        let botonCancelar = formulario.querySelector(".cancelar");
        let handleCancelar = Object.create(CancelarFormularioHandle);
        handleCancelar.formulario = formulario;
        handleCancelar.boton = botonEditar;
        botonCancelar.addEventListener("click", handleCancelar);
       
        let btnEnviarApiEdit = formulario.querySelector(".gasto-enviar-api");
        let handleEnviarApiEdit = Object.create(EnviarEdicionGastoApiHandle);
        handleEnviarApiEdit.formulario = formulario;
        handleEnviarApiEdit.gasto = this.gasto; // Le pasamos el gasto que estamos editando
        handleEnviarApiEdit.boton = botonEditar;
        btnEnviarApiEdit.addEventListener("click", handleEnviarApiEdit);

        e.currentTarget.parentNode.appendChild(formulario);
    }
};

const BorrarApiHandle = {
    handleEvent: async function(e) {
        if (!confirm(`¿Borrar "${this.gasto.descripcion}" de la API?`)) return;

        const nombre = document.querySelector('#nombre_usuario').value;
        
        const url = `https://suhhtqjccd.execute-api.eu-west-1.amazonaws.com/latest/${nombre}/${this.gasto.id}`;

        try {
            const res = await fetch(url, { method: 'DELETE' });

            if (res.ok) {
                alert("Gasto borrado de la API");
                //  Volvemos a pedir la lista para que se actualice la web
                cargarGastosApi();
            } else {
                alert("Error: No puedes borrar este gasto (quizás no es tuyo)");
            }
        } catch (error) {
            console.error("Fallo al borrar:", error);
        }
    }
};

// Manejador para crear un gasto nuevo (POST)
const EnviarNuevoGastoApiHandle = {
    handleEvent: async function(e) {
        e.preventDefault();
        const f = this.formulario;
        const nombre = document.querySelector('#nombre_usuario').value;

        const datosGasto = {
            descripcion: f.descripcion.value,
            valor: parseFloat(f.valor.value),
            fecha: f.fecha.value,
            etiquetas: f.etiquetas.value ? f.etiquetas.value.split(",") : []
        };

        const url = `https://suhhtqjccd.execute-api.eu-west-1.amazonaws.com/latest/${nombre}`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosGasto)
            });
            if (res.ok) {
                f.remove();
                if (this.boton) this.boton.disabled = false;
                cargarGastosApi(); // Actualiza la lista
            }
        } catch (error) { console.error("Error POST:", error); }
    }
};

// Manejador para editar un gasto existente (PUT)
const EnviarEdicionGastoApiHandle = {
    handleEvent: async function(e) {
        e.preventDefault();
        const f = this.formulario;
        const nombre = document.querySelector('#nombre_usuario').value;

        const datosGasto = {
            descripcion: f.descripcion.value,
            valor: parseFloat(f.valor.value),
            fecha: f.fecha.value,
            etiquetas: f.etiquetas.value ? f.etiquetas.value.split(",") : []
        };

        
        const url = `https://suhhtqjccd.execute-api.eu-west-1.amazonaws.com/latest/${nombre}/${this.gasto.id}`;

        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosGasto)
            });
            if (res.ok) {
                f.remove();
                if (this.boton) this.boton.disabled = false;
                cargarGastosApi(); // Actualiza la lista
            }
        } catch (error) { console.error("Error PUT:", error); }
    }
};

async function cargarGastosApi() {
    // Borramos todo lo viejo de otras prácticas para verlo mas limpio
    document.querySelectorAll('.gasto').forEach(g => g.remove()); 
    const f1 = document.querySelector('#listado-gastos-filtrados-1');
    const f2 = document.querySelector('#listado-gastos-filtrados-2');
    if (f1) f1.innerHTML = "";
    if (f2) f2.innerHTML = "";
    
    const inputNombre = document.querySelector('#nombre_usuario');
    const nombre = inputNombre.value;

    if (!nombre) {
        alert("Escribe tu nombre en el cuadro");
        return;
    }

    const url = `https://suhhtqjccd.execute-api.eu-west-1.amazonaws.com/latest/${nombre}`;

    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("Error en el servidor");

        const datosApi = await respuesta.json();
       
        gesPres.cargarGastos(datosApi); 
        repintar();

        console.log("¡Datos cargados con éxito!");
    } catch (error) {
        console.error("Fallo de conexión:", error);
    } //los console  de aca tambien, son ayuda para mi
}

function actualizarPresupuestoWeb() {
    let nuevoPres = prompt("Introduzca nuevo presupuesto:");
    
    if (nuevoPres) {
        let presupuestoNum = parseFloat(nuevoPres);
        gesPres.actualizarPresupuesto(presupuestoNum);
        repintar();
    }
}

function nuevoGastoWeb() {
    let d = prompt("Descripción:");
    let v = prompt("Valor:");
    let fecha = prompt("Fecha (yyyy-mm-dd):");
    let et = prompt("Etiquetas separadas por comas:");
    let valorNum = parseFloat(v);
    let etiquetasArray = et ? et.split(",") : [];

    let newGasto = new gesPres.CrearGasto(d, valorNum, fecha, ...etiquetasArray);
    gesPres.anyadirGasto(newGasto);
    repintar();
}

function nuevoGastoWebFormulario(e){
  let botonAnyadir = e.currentTarget;
  botonAnyadir.disabled = true;
  //para que no se puedan abrir dos formularios al mismo tiempo

  let plantillaFormulario = document.getElementById("formulario-template").content.cloneNode(true);
  //clono el formulario de html

  let formulario = plantillaFormulario.querySelector("form");

 let btnSubmit = formulario.querySelector('button[type="submit"]');
    // Al crear uno nuevo, está vacío, así que lo desactivamos de inicio
    btnSubmit.disabled = true;
    
    formulario.addEventListener("input", function() {
        // Si todos los campos 'required' están llenos, se activa
        btnSubmit.disabled = !formulario.checkValidity();
    });

  formulario.addEventListener("submit", function(event) {
      event.preventDefault();

      let f = event.currentTarget; //obtengo los datos del formulario
            
      let descripcion = f.descripcion.value;
      let valor = parseFloat(f.valor.value);
      let fecha = f.fecha.value;
      let etiquetasTexto = f.etiquetas.value;
      let etiquetasArray = etiquetasTexto ? etiquetasTexto.split(",") : [];

      let newGasto = new gesPres.CrearGasto(descripcion, valor, fecha, ...etiquetasArray);
      gesPres.anyadirGasto(newGasto);
      repintar();

      formulario.remove();
      let btn = document.getElementById("anyadirgasto-formulario");
      if (btn) btn.disabled = false;
    });
    
    let botonCancelar = formulario.querySelector(".cancelar");
    let handleCancelar = Object.create(CancelarFormularioHandle);
    handleCancelar.formulario = formulario; // Guardamos referencia al form para borrarlo
    handleCancelar.boton = botonAnyadir;    // Guardamos referencia al botón para activarlo

    let btnEnviarApi = formulario.querySelector(".gasto-enviar-api");
    let handleEnviarApi = Object.create(EnviarNuevoGastoApiHandle);
    handleEnviarApi.formulario = formulario;
    handleEnviarApi.boton = botonAnyadir;
    btnEnviarApi.addEventListener("click", handleEnviarApi);
    
    botonCancelar.addEventListener("click", handleCancelar);
    document.getElementById("controlesprincipales").appendChild(formulario);
}


function mostrarGastoWeb(idElemento, gasto) {
  const contenedor = document.querySelector("#" + idElemento);

  const divGasto = document.createElement("div");
  divGasto.classList.add("gasto");

  // descripción
  const divDesc = document.createElement("div");
  divDesc.classList.add("gasto-descripcion");
  divDesc.textContent = gasto.descripcion;
  divGasto.appendChild(divDesc);

  // fecha
  const divFecha = document.createElement("div");
  divFecha.classList.add("gasto-fecha");
  try {
      let fechaObj = new Date(gasto.fecha);
      if (!isNaN(fechaObj.getTime())) {
          divFecha.textContent = fechaObj.toISOString().substring(0,10);
      } else {
          divFecha.textContent = gasto.fecha;
      }
  } catch(e) { divFecha.textContent = gasto.fecha; }
  divGasto.appendChild(divFecha);

  // valor
  const divValor = document.createElement("div");
  divValor.classList.add("gasto-valor");
  divValor.textContent = gasto.valor.toFixed(2); 
  divGasto.appendChild(divValor);

  // etiquetas
  const divEtiquetas = document.createElement("div");
  divEtiquetas.classList.add("gasto-etiquetas");
  for (let etiqueta of gasto.etiquetas) {
    const span = document.createElement("span");
    span.classList.add("gasto-etiquetas-etiqueta");
    span.textContent = etiqueta;
   
    let handleEtiqueta = Object.create(BorrarEtiquetasHandle);
        handleEtiqueta.gasto = gasto;      // Vinculamos el gasto
        handleEtiqueta.etiqueta = etiqueta; // Vinculamos la etiqueta concreta
        span.addEventListener("click", handleEtiqueta, false);

        divEtiquetas.appendChild(span);
    }
    divGasto.appendChild(divEtiquetas);
       
    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.className = "gasto-editar";
    btnEditar.textContent = "Editar"; 
    let handleEdicion = Object.create(EditarHandle);
    handleEdicion.gasto = gasto;
    btnEditar.addEventListener("click", handleEdicion, false);
    divGasto.appendChild(btnEditar);
   
    const btnBorrar = document.createElement("button");
    btnBorrar.type = "button";
    btnBorrar.className = "gasto-borrar";
    btnBorrar.textContent = "Borrar";   
    let handleBorrado = Object.create(BorrarHandle);
    handleBorrado.gasto = gasto;
    btnBorrar.addEventListener("click", handleBorrado, false);
    divGasto.appendChild(btnBorrar);

    const btnEditarForm = document.createElement("button");
    btnEditarForm.type = "button";
    btnEditarForm.className = "gasto-editar-formulario"; 
    btnEditarForm.textContent = "Editar (formulario)";
    
    let handleEdicionForm = Object.create(EditarHandleFormulario);
    handleEdicionForm.gasto = gasto;
    
    btnEditarForm.addEventListener("click", handleEdicionForm, false);
    divGasto.appendChild(btnEditarForm);
    
    contenedor.appendChild(divGasto);

    const btnBorrarApi = document.createElement("button");
    btnBorrarApi.type = "button";
    btnBorrarApi.className = "gasto-borrar-api"; 
    btnBorrarApi.textContent = "Borrar (API)";

    let handleBorrarApi = Object.create(BorrarApiHandle);
    handleBorrarApi.gasto = gasto; // Le pasamos el gasto actual
    
    btnBorrarApi.addEventListener("click", handleBorrarApi, false);
    
    divGasto.appendChild(btnBorrarApi);
}
  
function mostrarGastosAgrupadosWeb(idElemento, agrup, periodo){
  const contenedor = document.querySelector("#" + idElemento);
  if(!contenedor) return;

  // Limpiamos el contenedor antes de pintar para que no se acumulen si llamamos varias veces
  contenedor.innerHTML = ""; 

  const divAgrup = document.createElement("div");
  divAgrup.classList.add("agrupacion");

  let periodoTexto = periodo;
  if (periodo === "dia") periodoTexto = "día";
  if (periodo === "anyo") periodoTexto = "año";

  const titulo = document.createElement("h1");
  titulo.textContent = "Gastos agrupados por " + periodoTexto;
  divAgrup.appendChild(titulo);
  
  for (let clave in agrup) {
    const divDato = document.createElement("div");
    divDato.classList.add("agrupacion-dato");

    const spanClave = document.createElement("span");
    spanClave.classList.add("agrupacion-dato-clave");
    spanClave.style.fontWeight = "bold";
    spanClave.textContent = clave + " : ";

    const spanValor = document.createElement("span");
    spanValor.classList.add("agrupacion-dato-valor");
    spanValor.textContent = agrup[clave].toFixed(2) + " €";

    divDato.appendChild(spanClave);
    divDato.appendChild(spanValor);
    divAgrup.appendChild(divDato);
  }

  contenedor.appendChild(divAgrup);
}

function repintar() {
  
  mostrarDatoEnId("presupuesto", gesPres.mostrarPresupuesto());
  
  let divPres = document.getElementById("presupuesto");
  if (divPres) {
      divPres.style.marginBottom = "20px"; 
  }
  let totalGastos= gesPres.calcularTotalGastos();
  mostrarDatoEnId("gastos-totales", "<strong> Total Gastos: </strong> " + totalGastos.toFixed(2) + " €");

  let balance = gesPres.calcularBalance();
  mostrarDatoEnId("balance-total", "<strong> Balance: </strong>" + balance.toFixed(2) + " €");

    let listadoDiv = document.getElementById("listado-gastos-completo");
    if (listadoDiv) {
      listadoDiv.innerHTML = ""; 
      
            let lista = gesPres.listarGastos();
      for (let gasto of lista) {
        mostrarGastoWeb("listado-gastos-completo", gasto);
      }
  }
}

let btnActPresupuesto = document.getElementById("actualizarpresupuesto");
if(btnActPresupuesto) {
    btnActPresupuesto.addEventListener("click", actualizarPresupuestoWeb, false);
}

let btnAnyadirGasto = document.getElementById("anyadirgasto");
if(btnAnyadirGasto) {
    btnAnyadirGasto.addEventListener("click", nuevoGastoWeb, false);
}

let btnAnyadirForm = document.getElementById("anyadirgasto-formulario");
if(btnAnyadirForm) {
    btnAnyadirForm.addEventListener("click", nuevoGastoWebFormulario, false);
}

let btnCargarApi = document.getElementById("cargar-gastos-api");
if (btnCargarApi) {
    btnCargarApi.addEventListener("click", cargarGastosApi, false);
}

export{
    mostrarDatoEnId,
    mostrarGastoWeb,
    mostrarGastosAgrupadosWeb,
    cargarGastosApi
    }