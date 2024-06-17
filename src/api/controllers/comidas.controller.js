import { User } from "../../models/Usuario.js";
import { Alimento } from "../../models/Alimento.js";
import moment from "moment-timezone";
import {
  calcularCaloriasConsumidas,
  crearProgreso,
  obtenerProgresoFromUser,
} from "../services/progresoService.js";

export const createComidas = async (req, res) => {
  try {
    const { userId, type, alimento, date } = req.body;

    // Buscar al usuario por su userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Normalizar la fecha al principio del día en UTC
    const dateNormalized = new Date(date);
    dateNormalized.setUTCHours(0, 0, 0, 0);

    // Buscar si ya existe un registro para la fecha dada en UTC
    let dailyFoodRecord = user.dailyFoods.find(
      (record) =>
        new Date(record.date).toISOString().split("T")[0] ===
        dateNormalized.toISOString().split("T")[0]
    );

    if (!dailyFoodRecord) {
      // Si no existe, crear un nuevo registro de comida diaria y agregar la comida
      dailyFoodRecord = {
        date: dateNormalized,
        meals: [{ type, alimentos: [alimento] }],
      };
      user.dailyFoods.push(dailyFoodRecord);
    } else {
      // Si el registro ya existe, buscar si ya existe una comida del mismo tipo
      let existingMeal = dailyFoodRecord.meals.find(
        (meal) => meal.type === type
      );

      if (existingMeal) {
        // Añadir alimentos a la comida existente
        existingMeal.alimentos.push(alimento);
      } else {
        // Si no existe la comida, crear y añadir la comida
        dailyFoodRecord.meals.push({ type, alimentos: [alimento] });
      }
    }

    await user.save();
    const fechaSinHora = dateNormalized.toISOString().split("T")[0];
    const progreso = await obtenerProgresoFromUser(userId, fechaSinHora);
    if (progreso === "No se encontró progreso para la fecha especificada.") {
      await crearProgreso(user.weight, user.height, userId, dateNormalized);
    }
    const prueba = await calcularCaloriasConsumidas(userId, date);

    res.status(201).send({
      success: true,
      message: "Comida registrada con éxito",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
};

// export const getComidasFromUsers = async (req, res) => {
//   try {
//     const { userId, date, type } = req.query;
//     const queryDate = moment(date, "YYYY-MM-DD").format(
//       "YYYY-MM-DDT00:00:00.000+00:00"
//     );

//     // Buscar el usuario y hacer populate en el path especificado
//     const user = await User.findOne({ userId })
//       .populate({
//         path: "dailyFoods.meals.alimentos._id",
//         model: "Alimento",
//       })
//       .exec();

//     if (!user) {
//       return res.status(404).send("Usuario no encontrado");
//     }

//     // Buscar el registro de alimentos diarios para la fecha dada
//     const dailyFoodRecord = user.dailyFoods.find((record) =>
//       moment(record.date).isSame(queryDate, "day")
//     );

//     let meals = [];
//     if (dailyFoodRecord && dailyFoodRecord.meals) {
//       // Filtrar comidas por tipo si es especificado, sino devolver todas
//       meals = dailyFoodRecord.meals.filter(
//         (meal) => !type || meal.type === type
//       );
//     }

//     res.json(meals);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       success: false,
//       message: "Error al procesar la solicitud",
//       error: error.message,
//     });
//   }
// };

export const getComidasFromUsers = async (req, res) => {
  try {
    const { userId, date, type } = req.query;
    const queryDate = moment(req.query.date, "YYYY-MM-DD").format(
      "YYYY-MM-DDT00:00:00.000+00:00"
    );

    // Buscar el usuario y hacer populate en el path especificado
    const user = await User.findOne({ userId })
      .populate({
        path: "dailyFoods.meals.alimentos._id",
        model: "Alimento",
      })
      .exec();

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Buscar el registro de alimentos diarios para la fecha dada
    const dailyFoodRecord = user.dailyFoods.find((record) =>
      moment(record.date).isSame(queryDate, "day")
    );

    let meals = [];
    if (dailyFoodRecord && dailyFoodRecord.meals) {
      // Filtrar comidas por tipo si es especificado, sino devolver todas
      meals = dailyFoodRecord.meals.filter(
        (meal) => !type || meal.type === type
      );
    }

    res.json(meals);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
};

export const getComidasByDateRange = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    // Buscar al usuario por su userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Convertir fechas de consulta a objetos Date en UTC
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    // Filtrar y agrupar comidas por fecha dentro del rango en UTC
    const groupedFoods = user.dailyFoods.reduce((acc, dailyFood) => {
      const foodDate = new Date(dailyFood.date);
      if (foodDate >= start && foodDate <= end) {
        const dateKey = foodDate.toISOString().split("T")[0];
        acc[dateKey] = acc[dateKey] || {
          Desayuno: false,
          "Media Mañana": false,
          Almuerzo: false,
          Merienda: false,
          Cena: false,
        };
        dailyFood.meals.forEach((meal) => {
          acc[dateKey][meal.type] = true;
        });
      }
      return acc;
    }, {});

    res.json(groupedFoods);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
};

export const getComidaByDate = async (req, res) => {
  try {
    const { userId, date, mealType } = req.query;

    // Validar mealType
    const validMealTypes = ["Desayuno", "Almuerzo", "Cena"];
    if (!validMealTypes.includes(mealType)) {
      return res.status(400).send({
        success: false,
        message: "Tipo de comida inválido",
      });
    }

    // Buscar al usuario por su userId
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Convertir la fecha de consulta a un objeto Moment.js
    const targetDate = moment(date, "YYYY-MM-DD");

    // Buscar alimentos para la fecha y tipo de comida dados
    let foodFound = false;

    user.dailyFoods.forEach((dailyFood) => {
      const foodDate = moment(dailyFood.date);
      if (foodDate.isSame(targetDate, "day")) {
        dailyFood.meals.forEach((meal) => {
          if (meal.type === mealType) {
            foodFound = true;
          }
        });
      }
    });

    if (foodFound) {
      res.json({
        success: true,
        message: `Se encontraron alimentos para el ${mealType} de la fecha dada`,
      });
    } else {
      res.json({
        success: false,
        message: `No se encontraron alimentos para el ${mealType} de la fecha dada`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
};

export const deleteComida = async (req, res) => {
  try {
    const { userId, date, type, alimentoId } = req.query;

    // Buscar al usuario por su userId
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Convertir la fecha de consulta a una fecha JavaScript
    const queryDate = new Date(date);

    // Buscar el registro de alimentos diarios para la fecha dada
    const dailyFoodRecord = user.dailyFoods.find(
      (record) =>
        record.date.toISOString().split("T")[0] ===
        queryDate.toISOString().split("T")[0]
    );

    if (!dailyFoodRecord) {
      return res
        .status(404)
        .send("Registro de comida no encontrado para la fecha especificada");
    }

    // Buscar la comida específica
    const meal = dailyFoodRecord.meals.find((m) => m.type === type);

    if (!meal) {
      return res.status(404).send("Tipo de comida no encontrado");
    }

    // Filtrar los alimentos para eliminar el especificado
    const alimentoIndex = meal.alimentos.findIndex(
      (item) => item._id.toString() === alimentoId
    );

    if (alimentoIndex > -1) {
      meal.alimentos.splice(alimentoIndex, 1);
    } else {
      console.log(meal);
      return res.status(404).send("Alimento no encontrado");
    }

    await user.save();
    calcularCaloriasConsumidas(userId, date);

    res.status(200).send({
      success: true,
      message: "Alimento eliminado con éxito",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
};

export const searchComida = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    // Función para reemplazar caracteres con acentos por una regex que incluya ambas versiones
    const regexQuery = searchQuery
      .replace(/a/g, "[aá]")
      .replace(/e/g, "[eé]")
      .replace(/i/g, "[ií]")
      .replace(/o/g, "[oó]")
      .replace(/u/g, "[uú]")
      .replace(/n/g, "[nñ]");

    const regex = new RegExp(regexQuery, "i"); // 'i' para ignorar mayúsculas/minúsculas

    const foods = await Alimento.find({ name: { $regex: regex } }).collation({
      locale: "es",
      strength: 1,
    });

    res.json(foods);
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error);
  }
};
