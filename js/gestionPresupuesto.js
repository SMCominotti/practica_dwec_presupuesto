// TODO: Crear las funciones, objetos y variables indicadas en el enunciado

let presupuesto = 0;
let gastos = [];
let idGasto = 0;

function actualizarPresupuesto(nvoPresupuesto) {
  if (nvoPresupuesto >= 0) {
    presupuesto = nvoPresupuesto;
    return nvoPresupuesto;
  } else {
    console.log("Presupuesto no válido");
    return -1;
  }
}

function mostrarPresupuesto() {
  return `Tu presupuesto actual es de ${presupuesto} €`;
}

// Etiquetas va con los ... porque no viene de ningun parametro, sino de una lista variable de parametros, por lo tanto a partir del 4to parametro, se introducen dentro de un array que se llamara etiquetas.

function CrearGasto(descripcion, valor, fecha, ...etiquetas) {
    // Métodos
  this.mostrarGasto = function () {
    return `Gasto correspondiente a ${this.descripcion} con valor ${this.valor} €`;
  };
  
  this.actualizarDescripcion = function (nvaDescripcion) {
    this.descripcion = nvaDescripcion;
  };

  this.actualizarValor = function (nvoValor) {
    if (nvoValor >= 0) {
      this.valor = nvoValor;
    }
  };

  this.mostrarGastoCompleto = function () {
    let texto = `Gasto correspondiente a ${this.descripcion} con valor ${this.valor} €.\n`;
        texto += `Fecha: ${new Date(this.fecha).toLocaleString()}\n`;
        texto += `Etiquetas:\n`;
//   primero lo convierto a fecha con newdate y luego a string con tolocalestring()

    for (let etiqueta of this.etiquetas) {
      texto += `- ${etiqueta}\n`
    }
    return texto;
  };

  this.actualizarFecha = function(nuevaFecha) {
        let fechaConvertida = Date.parse(nuevaFecha);
        if (fechaConvertida) {
            this.fecha = fechaConvertida;
        }
    };
// primero chequeo que no exista la etiqueta para añadirla

    this.anyadirEtiquetas = function(...etiquetasNuevas) {
        for (let etiqueta of etiquetasNuevas) {
            if (!this.etiquetas.includes(etiqueta)) {
                this.etiquetas.push(etiqueta);
            }
        }
    };

    this.borrarEtiquetas = function(...etiquetasAEliminar) {
        this.etiquetas = this.etiquetas.filter(function(etiqueta) {
            return !etiquetasAEliminar.includes(etiqueta);
        });
    };

    // Otra opción, mostrada en clase: Busco en el array de etiquetas que se quieren borrar, si esta, muestra -1, si no está, la agrega al nuevo array. Luego muestra el nuevo array que ya no tendrá las etiquetas que se querían borrar.
    // this.borrarEtiquetas = function(...etqs) {
    //     let newetiquetas = [];

    //     for (let e of this.etiquetas) {
	//     if (etqs.indexOf(e) == -1) {
    //             newetiquetas.push(e);
	//     }
    //     }

    //     this.etiquetas = newetiquetas;
    // }

this.obtenerPeriodoAgrupacion = function(periodo) {
    let fechaGasto = new Date(this.fecha);

    let anio = fechaGasto.getFullYear();
    let mes = (fechaGasto.getMonth() + 1).toString().padStart(2, '0'); 
    let dia = fechaGasto.getDate().toString().padStart(2, '0');

    if (periodo === "dia") return `${anio}-${mes}-${dia}`;
    if (periodo === "mes") return `${anio}-${mes}`;
    if (periodo === "anyo") return `${anio}`;
};
// padStart es para devolver 2 dígitos

  //Propiedades:
    if (valor >= 0) {
    this.valor = valor;
  } else {
    this.valor = 0;
  }

  this.descripcion = descripcion;

  let f = Date.parse(fecha);
  if (f) {
    this.fecha = f;
  } else {
    this.fecha = Date.parse(new Date());
    //   Si la fecha no es correcta o no hay fecha, la fecha sera la actual
  }

  this.etiquetas=[];
  this.anyadirEtiquetas(...etiquetas);
}

function listarGastos() {
  return gastos;
}

function anyadirGasto(gasto) {
    gasto.id = idGasto++;
    gastos.push(gasto);
}

function borrarGasto(idGasto) {
    let gasto = null;
    for (let g of gastos) {
        if (g.id == idGasto){
            gasto = g;
        }
    }
    // Busco la posicion que quiero borrar y el numero de elementos con splice
    if (gasto){
        let posGasto = gastos.indexOf(gasto);
        gastos.splice(posGasto,1);
    }
}

function calcularTotalGastos() {
    let total= 0;
    for (let g of gastos){
        total += g.valor;
    }
    return total;
}

function calcularBalance() {
    return presupuesto - calcularTotalGastos()
}

function filtrarGastos(filtros) {
    return gastos.filter(function(gasto) {
        let cumple = true;

        if (filtros.fechaDesde) {
            var fechaInicio = Date.parse(filtros.fechaDesde);
            cumple = cumple && (gasto.fecha >= fechaInicio);
        }

        if (filtros.fechaHasta) {
            var fechaFin = Date.parse(filtros.fechaHasta);
            cumple = cumple && (gasto.fecha <= fechaFin);
        }

        if (filtros.valorMinimo) {
            cumple = cumple && (gasto.valor >= filtros.valorMinimo);
        }

        if (filtros.valorMaximo) {
            cumple = cumple && (gasto.valor <= filtros.valorMaximo);
        }

        if (filtros.descripcionContiene) {
            cumple = cumple && (gasto.descripcion.indexOf(filtros.descripcionContiene) > -1);
        }

        if (filtros.etiquetasTiene) {
            let etiquetaCoincide = false;
            for (let etiquetaFiltro of filtros.etiquetasTiene) {
                if (gasto.etiquetas.indexOf(etiquetaFiltro) > -1) {
                    etiquetaCoincide = true;
                }
            }
            cumple = cumple && etiquetaCoincide;
        }

        return cumple;
    });
}

function agruparGastos(periodo, etiquetas, fechaDesde, fechaHasta) {

    let filtros = {
        etiquetasTiene: etiquetas,
        fechaDesde: fechaDesde,
        fechaHasta: fechaHasta
    };

    let gastosFiltrados = filtrarGastos(filtros);

    return gastosFiltrados.reduce(function(acumulador, gasto) {

        let periodoGasto = gasto.obtenerPeriodoAgrupacion(periodo);

        if (acumulador[periodoGasto]) {
            acumulador[periodoGasto] += gasto.valor;
        } else {
            acumulador[periodoGasto] = gasto.valor;
        }

        return acumulador;

    }, {}); // {}, al final → crea el objeto vacío inicial donde se irán sumando los valores de cada período.
}

//Filtrado
function transformarListadoEtiquetas(lista) {
  // Si la lista es null o undefined, devolvemos array vacío
  if (!lista) return []; 
  
  // Buscamos todas las palabras alfanuméricas
  return lista.match(/[a-z0-9]+/gi) || [];
}

function cargarGastos(nuevosGastos) {
    gastos = []; // Vaciamos la lista local

    for (let g of nuevosGastos) {
  
        let gastoConvertido = new CrearGasto(g.descripcion, g.valor, g.fecha, ...g.etiquetas);
       
        // REHIDRATAMOS LAS ETIQUETAS
        if (g.etiquetas) {
            gastoConvertido.etiquetas = [...g.etiquetas];
        }
        
        gastoConvertido.id = g.gastoId || g.id;

        gastos.push(gastoConvertido);
    }
    
}

// Este es el de clase, cambiando el nombre de gastoId
// function cargarGastos(gastosAlmacenamiento) {
//     // gastosAlmacenamiento es un array de objetos "planos"
//     // No tienen acceso a los métodos creados con "CrearGasto":
//     // "anyadirEtiquetas", "actualizarValor",...
//     // Solo tienen guardadas sus propiedades: descripcion, valor, fecha y etiquetas
  
//     // Reseteamos la variable global "gastos"
//     gastos = [];
//     // Procesamos cada gasto del listado pasado a la función
//     for (let g of gastosAlmacenamiento) {
//         // Creamos un nuevo objeto mediante el constructor
//         // Este objeto tiene acceso a los métodos "anyadirEtiquetas", "actualizarValor",...
//         // Pero sus propiedades (descripcion, valor, fecha y etiquetas) están sin asignar
//         let gastoRehidratado = new CrearGasto();
//         // Copiamos los datos del objeto guardado en el almacenamiento
//         // al gasto rehidratado
//         // https://es.javascript.info/object-copy#cloning-and-merging-object-assign
//         Object.assign(gastoRehidratado, g);
//         // Ahora "gastoRehidratado" tiene las propiedades del gasto
//         // almacenado y además tiene acceso a los métodos de "CrearGasto"
          
//         // Si el objeto g tiene 'gastoId' (porque viene de la API)
//         // se lo asignamos a '.id' para que tus botones de borrar/editar funcionen.
//         if (g.gastoId) {
//             gastoRehidratado.id = g.gastoId;
//         }

//         // Añadimos el gasto rehidratado a "gastos"
//         gastos.push(gastoRehidratado)
//     }
// }
    

// NO MODIFICAR A PARTIR DE AQUÍ: exportación de funciones y objetos creados para poder ejecutar los tests.
// Las funciones y objetos deben tener los nombres que se indican en el enunciado
// Si al obtener el código de una práctica se genera un conflicto, por favor incluye todo el código que aparece aquí debajo
export {
  mostrarPresupuesto,
  actualizarPresupuesto,
  CrearGasto,
  listarGastos,
  anyadirGasto,
  borrarGasto,
  calcularTotalGastos,
  calcularBalance,
  filtrarGastos,
  agruparGastos,
  cargarGastos,
  transformarListadoEtiquetas
};
