import { User } from "../../models/Usuario.js";

export const alimentarProgreso = async (req, res) => {
  const usuarioId = 1;
  const cantidadRegistros = 1000; // Cantidad de registros de progreso que deseas añadir

  const user = await User.findOne({ userId: usuarioId });
  if (!user) {
    console.log("Usuario no encontrado");
    return;
  }

  // Función para generar una fecha aleatoria en un rango de fechas pasadas
  function generarFechaPasada() {
    const fechaHoy = new Date();
    const fechaAleatoria = new Date(
      fechaHoy - Math.floor(Math.random() * (1000 * 60 * 60 * 24 * 365 * 10))
    ); // Fechas en los últimos 10 años
    return fechaAleatoria.toISOString().slice(0, 10); // Formatear la fecha como 'YYYY-MM-DD'
  }

  // Crear registros de progreso con fechas pasadas y únicas
  const fechasUtilizadas = new Set(); // Conjunto para mantener un registro de las fechas utilizadas
  for (let i = 0; i < cantidadRegistros; i++) {
    let fecha = generarFechaPasada();
    // Asegurarse de que la fecha generada sea única
    while (fechasUtilizadas.has(fecha)) {
      fecha = generarFechaPasada();
    }
    fechasUtilizadas.add(fecha);

    // Crear un nuevo registro de progreso
    const nuevoProgreso = {
      imc: Math.random() * 10 + 20, // Generar un IMC aleatorio entre 20 y 30
      peso: Math.random() * 30 + 50, // Generar un peso aleatorio entre 50 y 80
      nivel_peso: "Peso Normal",
      fecha: fecha,
    };

    user.progress.push(nuevoProgreso);
  }

  // Guardar los cambios en la base de datos
  await user.save();
  res
    .status(201)
    .json(
      "Se agregaron " +
        cantidadRegistros +
        " registros de progreso al usuario con id " +
        usuarioId
    );
  // console.log(
  //   `Se agregaron ${cantidadRegistros} registros de progreso al usuario con ID ${usuarioId}`
  // );
};

export const calcularImc = async (peso, altura) => {
  const alturaMetros = altura / 100;
  const imc = (peso / alturaMetros ** 2).toFixed(2);

  let nivel_peso = "";
  switch (true) {
    case imc < 18.5:
      nivel_peso = "Bajo Peso";
      break;
    case imc < 24.9:
      nivel_peso = "Peso Normal";
      break;
    case imc < 29.9:
      nivel_peso = "Sobrepeso";
      break;
    case imc < 34.9:
      nivel_peso = "Obesidad tipo I";
      break;
    case imc < 39.9:
      nivel_peso = "Obesidad tipo II";
      break;
    default:
      nivel_peso = "Obesidad tipo III";
  }
  return { imc, nivel_peso };
};

export const obtenerProgresoFromUser = async (userId, fecha) => {
  const user = await User.findOne({ userId: userId });

  if (!user) {
    return res.status(404).json("Usuario no encontrado");
  }

  const progreso = user.progress.find((progress) => progress.fecha === fecha);

  if (!progreso) {
    return "No se encontró progreso para la fecha especificada.";
  }

  return { progreso };
};

export const calcularCaloriasConsumidas = async (userId, fecha) => {
  try {
    const user = await User.findOne({ userId: userId })
      .populate({
        path: "dailyFoods.meals.alimentos._id",
        model: "Alimento",
      })
      .exec();
    if (!user) {
      return "Usuario no encontrado";
    }

    // Encontrar las comidas del día especificado
    const dailyFood = user.dailyFoods.find(
      (df) => df.date.toISOString().split("T")[0] === fecha
    );

    if (!dailyFood) {
      return "No se encontraron comidas para la fecha especificada";
    }

    let totalCaloriasConsumidas = 0;

    dailyFood.meals.forEach((meal) => {
      // Iteramos sobre cada comida (meal) en el arreglo meals
      meal.alimentos.forEach((alimento) => {
        // Iteramos sobre cada alimento (alimento) en el arreglo alimentos de la comida actual

        // Obtener la cantidad de calorías del alimento
        const caloriasAlimento = alimento._id.measurementUnits.get(
          alimento.unidadMedida
        ).calorie;

        const cantidad = alimento.cantidad;
        const caloriasConsumidas = caloriasAlimento * cantidad;
        // Sumar las calorías consumidas al total
        totalCaloriasConsumidas += caloriasConsumidas;
      });
    });

    // Obtenemos el progreso del usuario en la fecha dada
    let { progreso } = await obtenerProgresoFromUser(userId, fecha);

    if (!progreso) {
      const { height, weight, userId } = user;
      progreso = crearProgreso(weight, height, userId);
      progreso.calorias_consumidas = totalCaloriasConsumidas;

      progreso.balance_calorico =
        progreso.calorias_consumidas - (progreso.calorias_quemadas || 0);
      console.log(progreso);
    }

    //Al arreglo de progreso se le añade una nueva propiedad
    progreso.calorias_consumidas = totalCaloriasConsumidas;
    progreso.balance_calorico =
      progreso.calorias_consumidas - (progreso.calorias_quemadas || 0);

    console.log("Mostrar progreso luego de añadir comida");
    console.log(progreso);

    const respuesta = await updateProgreso(userId, fecha, progreso);
    return respuesta;

    //res.status(201).json(dailyFood);
  } catch (error) {
    return { error: error.message };
  }
};

export const calcularCaloriasQuemadas = async (userId, fecha) => {
  try {
    const user = await User.findOne({ userId: userId }).populate({
      path: "rutinas.rutina",
      model: "Rutina",
    });
    if (!user) {
      return "Usuario no encontrado";
    }

    const rutinasCompletadas = user.rutinas.filter(
      (rutina) =>
        rutina.fecha.toISOString().split("T")[0] === fecha &&
        rutina.estado === "Completada"
    );

    if (rutinasCompletadas.lenght === 0) {
      return "Rutinas no encontradas";
    }

    let totalCaloriasQuemadas = 0;

    rutinasCompletadas.forEach((rutinaCompletada) => {
      totalCaloriasQuemadas += rutinaCompletada.rutina.calorias_quemadas;
    });

    // Obtenemos el progreso del usuario en la fecha dada
    let { progreso } = await obtenerProgresoFromUser(userId, fecha);
    console.log(progreso);

    if (!progreso) {
      const { height, weight, userId } = user;
      progreso = crearProgreso(weight, height, userId);
      progreso.calorias_quemadas = totalCaloriasQuemadas;
      progreso.balance_calorico =
        (progreso.calorias_consumidas || 0) - progreso.calorias_quemadas;
    }

    //Al arreglo de progreso se le añade una nueva propiedad
    progreso.calorias_quemadas = totalCaloriasQuemadas;
    progreso.balance_calorico =
      (progreso.calorias_consumidas || 0) - progreso.calorias_quemadas;
    console.log(progreso);

    const respuesta = await updateProgreso(userId, fecha, progreso);
    return { respuesta, progreso };
  } catch (error) {
    return { mensaje: "Ocurrio un error", error: error.message };
  }
};

export const crearProgreso = async (peso, altura, userId, date) => {
  try {
    const user = await User.findOne({ userId: userId });

    if (!user) {
      return "usuario no encontrado";
    }

    // calcular el peso y nivel de peso del usuario encontrado.
    const { imc, nivel_peso } = await calcularImc(peso, altura);

    // Si se proporciona una fecha, usarla; de lo contrario, usar la fecha actual
    let dateOnly;
    if (date) {
      dateOnly = new Date(date).toISOString().slice(0, 10);
    } else {
      const currentDate = new Date();
      const offset = currentDate.getTimezoneOffset();
      currentDate.setMinutes(currentDate.getMinutes() - offset);
      currentDate.setUTCHours(0, 0, 0, 0);
      const formattedDate = currentDate.toISOString();
      dateOnly = formattedDate.slice(0, 10);
    }

    // Encontrar el objeto de progreso con la fecha buscada
    const progresoEncontradoIndex = user.progress.findIndex(
      (progreso) => progreso.fecha === dateOnly
    );

    const newProgress = {
      imc: imc,
      peso: peso,
      nivel_peso: nivel_peso,
      fecha: dateOnly,
    };

    if (progresoEncontradoIndex !== -1) {
      // Actualizar el progreso encontrado con los nuevos valores
      user.progress[progresoEncontradoIndex] = newProgress;
      console.log("Se actualizó el progreso para la fecha", dateOnly + ":");
      console.log(user.progress[progresoEncontradoIndex]);
      // Guardar los cambios en la base de datos
      await user.save();
    } else {
      user.progress.push(newProgress);
      await user.save();
      console.log("No se encontró ningún progreso para la fecha", dateOnly);
    }
    return user.progress;
  } catch (error) {
    return error.message;
  }
};

export const updateProgreso = async (userId, fecha, nuevoProgreso) => {
  try {
    const user = await User.findOne({ userId: userId });
    //const dateOnly = new Date(fecha).toISOString().slice(0, 10);
    if (!user) {
      return "Usuario no encontrado";
    }

    //buscar el indice del progreso por la fecha que recibe por parametro
    const progresoEncontradoIndex = user.progress.findIndex(
      (progreso) => progreso.fecha === fecha
    );

    // Si se encuentra el progreso, actualiza sus valores
    if (progresoEncontradoIndex !== -1) {
      user.progress[progresoEncontradoIndex] = nuevoProgreso;
    } else {
      // Si no se encuentra el progreso, añade uno nuevo al arreglo de progreso
      user.progress.push(nuevoProgreso);
    }
    // Guarda los cambios en la base de datos
    await user.save();
    return "Progreso actualizado con éxito";
  } catch (error) {
    return error.message;
  }
};
