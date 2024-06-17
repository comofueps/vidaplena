// vidaPlenaRoutes.js
// const express = require("express");
// const router = express.Router();
// const User = require("../../models/Usuario");
// const Alimento = require("../../models/Alimento");
// const moment = require("moment-timezone");
// const AlimentoBase = require("../../models/AlimentoBase");
// const Notification = require("../../models/Notification");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const admin = require("firebase-admin");
// const serviceAccount = require("../../utils/ips-medigroup.json");

import express from "express";
import { Router } from "express";
import { User } from "../../models/Usuario.js";
import { Alimento } from "../../models/Alimento.js";
import { moment } from "moment-timezone";
import { AlimentoBase } from "../../models/AlimentoBase.js";
import { Notification } from "../../models/Notification.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { admin } from "firebase-admin";
import { serviceAccount } from "../../utils/ips-medigroup.js";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

router.get("/", (req, res) => {
  res.status(200).send("Respuesta exitosa");
});

//** SECCION PETICIONES DE USUARIO **//

router.get("/users", async (req, res) => {
  try {
    const usuarios = await User.find();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).send("Error al obtener los usuarios: " + error.message);
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const usuario = await User.findOne({ userId: userId });

    if (!usuario) {
      return res.status(404).send("Usuario no encontrado");
    }

    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).send("Error al obtener el usuario: " + error.message);
  }
});

router.patch("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body; // Objeto con los campos a actualizar

    const usuario = await User.findOne({ userId: userId });
    if (!usuario) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Actualizar los campos
    for (let key in updateData) {
      if (updateData.hasOwnProperty(key)) {
        usuario[key] = updateData[key];
      }
    }

    await usuario.save();
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).send("Error al actualizar el usuario: " + error.message);
  }
});

// Ruta para crear un nuevo usuario (POST)
router.post("/create-user", async (req, res) => {
  try {
    // Buscar el usuario por userId, si no existe, lo crea.
    const usuario = await User.findOneAndUpdate(
      { userId: req.body.userId },
      req.body,
      { new: true, upsert: true }
    );

    // Enviar respuesta
    res.status(200).json({
      success: true,
      message: usuario.isNew
        ? "Usuario creado con éxito."
        : "Usuario actualizado con éxito.",
      usuario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

//** SECCIÓN PETICIONES PARA ALIMENTOS **//
router.post("/create-alimento", async (req, res) => {
  try {
    // Buscar si el alimento ya existe
    const alimentoExistente = await Alimento.findOne({ name: req.body.name });

    if (alimentoExistente) {
      return res.status(409).json({
        // Código 409 para conflicto
        success: false,
        message: "El alimento ya existe en la base de datos.",
      });
    }

    // Si no existe, crear un nuevo alimento
    const alimento = new Alimento(req.body);
    const alimentoGuardado = await alimento.save();

    res.status(201).json({
      success: true,
      message: "Alimento creado con éxito.",
      alimento: alimentoGuardado,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/create-alimentos", async (req, res) => {
  try {
    // Asegúrate de que la entrada es un array
    if (!Array.isArray(req.body)) {
      return res.status(400).send({
        success: false,
        message: "Se espera un array de alimentos",
      });
    }

    // Iterar sobre el array y guardar cada alimento si no existe
    const alimentosGuardados = [];
    for (const alimentoData of req.body) {
      let alimento = await Alimento.findOne({ name: alimentoData.name });

      if (!alimento) {
        alimento = new Alimento(alimentoData);
        const alimentoGuardado = await alimento.save();
        alimentosGuardados.push(alimentoGuardado);
      }
    }

    // Enviar respuesta con todos los alimentos guardados o existentes
    res.status(201).json({
      success: true,
      message: "Alimentos procesados correctamente.",
      alimentos: alimentosGuardados,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/alimentos", async (req, res) => {
  try {
    const alimentos = await Alimento.find();
    res.status(200).json(alimentos);
  } catch (error) {
    res.status(500).send("Error al obtener los alimentos: " + error.message);
  }
});

router.put("/alimento/:id", async (req, res) => {
  try {
    const alimentoActualizado = await Alimento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(alimentoActualizado);
  } catch (error) {
    res.status(500).send("Error al actualizar el alimento: " + error.message);
  }
});

router.delete("/alimento/:id", async (req, res) => {
  try {
    await Alimento.findByIdAndDelete(req.params.id);
    res.status(200).send("Alimento eliminado con éxito");
  } catch (error) {
    res.status(500).send("Error al eliminar el alimento: " + error.message);
  }
});

/* ----------------- RUTAS PARA REGISTRAR COMIDAS Y OBTENER */
router.post("/food", async (req, res) => {
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
});

router.get("/food", async (req, res) => {
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
});

router.get("/foodByDateRange", async (req, res) => {
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
});

router.get("/foodByDate", async (req, res) => {
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
});

router.delete("/food", async (req, res) => {
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
});

router.get("/search", async (req, res) => {
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
  } catch (err) {
    res.status(500).send(err);
  }
});
/*------------------------------ fin ---------------------------*/

// crear alimentos base
router.post("/create-alimentos-base", async (req, res) => {
  try {
    // Asegúrate de que la entrada es un array
    if (!Array.isArray(req.body)) {
      return res.status(400).send({
        success: false,
        message: "Se espera un array de alimentos",
      });
    }

    // Iterar sobre el array y guardar cada alimento si no existe
    const alimentosGuardados = [];
    for (const alimentoData of req.body) {
      let alimento = await AlimentoBase.findOne({ name: alimentoData.name });

      if (!alimento) {
        alimento = new AlimentoBase(alimentoData);
        await alimento.save();
        alimentosGuardados.push(alimento);
      }
    }

    // Enviar respuesta con todos los alimentos guardados
    res.status(201).json({
      success: true,
      message: "Alimentos procesados correctamente.",
      alimentos: alimentosGuardados,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/alimentos-base", async (req, res) => {
  try {
    const alimentos = await AlimentoBase.find();
    res.status(200).json(alimentos);
  } catch (error) {
    res.status(500).send("Error al obtener los alimentos: " + error.message);
  }
});

router.post("/ia-create-food", async (req, res) => {
  try {
    const prompt = req.query.text;
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, message: "No se proporcionó texto" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log(text);
    res.status(200).json({ success: true, message: text });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al procesar la solicitud" });
  }
});

/* RUTAS PARA LAS NOTIFICACIONES, INVITACIONES, ALERTAS, ETC... */
router.post("/send-invitation", async (req, res) => {
  try {
    const { senderUserId, receiverUserId } = req.body;

    // Buscar ambos usuarios por userId
    const senderUser = await User.findOne({ userId: senderUserId });
    const receiverUser = await User.findOne({ userId: receiverUserId });

    if (!senderUser || !receiverUser) {
      return res.status(200).send({
        success: false,
        message: "Uno o ambos usuarios no encontrados.",
      });
    }

    // Verificar si el receptor ya es compañero del remitente
    if (senderUser.companions.includes(receiverUser._id)) {
      return res.status(200).send({
        success: false,
        message: "El usuario ya es tu compañero.",
      });
    }

    // Crear la notificación de invitación
    const notification = new Notification({
      user: receiverUser._id, // ID del receptor de la notificación
      sender: senderUser._id,
      title: "INVITACIÓN DE COMPAÑERO",
      body: `El usuario ${senderUser.name} ${
        senderUser.lastname || ""
      } te ha invitado a ser su compañero.`,
      type: "Invitation",
    });

    // Guardar la notificación
    await notification.save();

    const message = {
      token: receiverUser.fcmToken,
      notification: {
        title: "INVITACIÓN DE COMPAÑERO",
        body: `${senderUser.name} te ha invitado a ser su compañero en Vida Plena.`,
      },
      data: {
        title: "INVITACIÓN DE COMPAÑERO",
        body: `${senderUser.name} te ha invitado a ser su compañero Vida Plena.`,
        link: "https://ipsmedigroup.page.link/vidaplena",
      },
      // Puedes añadir otras opciones aquí, como 'data' si es necesario
    };

    // Enviar el mensaje
    admin.messaging().send(message);

    res.status(201).json({
      success: true,
      message: "Invitación enviada correctamente.",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/accept-invitation", async (req, res) => {
  try {
    const { userId, companionUserId } = req.body;

    // Buscar ambos usuarios por sus userId
    const user = await User.findById(userId);
    const companionUser = await User.findById(companionUserId);

    if (!user || !companionUser) {
      return res.status(404).send({
        success: false,
        message: "Uno o ambos usuarios no encontrados.",
      });
    }

    // Asegurarse de que no son ya compañeros
    if (user.companions.includes(companionUser._id)) {
      return res.status(400).send({
        success: false,
        message: "Ya son compañeros.",
      });
    }

    const message = {
      token: companionUser.fcmToken,
      notification: {
        title: "INVITACIÓN ACEPTADA",
        body: `${user.name} ahora es tu compañero en Vida Plena.`,
      },
      data: {
        title: "INVITACIÓN ACEPTADA",
        body: `${user.name} ahora es tu compañero en Vida Plena.`,
        link: "https://ipsmedigroup.page.link/vidaplena",
      },
    };

    // Enviar el mensaje
    admin.messaging().send(message);

    // Agregar a cada usuario como compañero del otro
    user.companions.push(companionUser._id);
    companionUser.companions.push(user._id);

    await user.save();
    await companionUser.save();

    res.status(200).json({
      success: true,
      message: "Invitación aceptada y compañero agregado.",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/notifications/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Buscar el usuario por userId
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    // Buscar las notificaciones del usuario y poblar los detalles del usuario
    const notifications = await Notification.find({ user: user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Notificaciones obtenidas correctamente.",
      notifications: notifications,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.patch("/notifications/read/:notificationId", async (req, res) => {
  try {
    const notificationId = req.params.notificationId;

    // Buscar y actualizar la notificación
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).send({
        success: false,
        message: "Notificación no encontrada.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notificación marcada como leída.",
      notification: notification,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/notifications/:notificationId", async (req, res) => {
  try {
    const notificationId = req.params.notificationId;

    // Buscar y eliminar la notificación
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
    });

    if (!notification) {
      return res.status(404).send({
        success: false,
        message: "Notificación no encontrada.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notificación eliminada con éxito.",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/send-notification", async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    // Buscar el usuario y obtener su token FCM
    const user = await User.findOne({ userId: userId });
    if (!user || !user.fcmToken) {
      return res.status(404).send({
        success: false,
        message: "Usuario o token FCM no encontrado.",
      });
    }

    // Crear el mensaje
    const message = {
      token: user.fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: {
        title: title,
        body: body,
      },
      // Puedes añadir otras opciones aquí, como 'data' si es necesario
    };

    // Enviar el mensaje
    const response = await admin.messaging().send(message);

    res
      .status(200)
      .send({ success: true, message: "Notificación enviada correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

router.get("/companions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar al usuario por su userId
    const user = await User.findOne({ userId }).populate({
      model: "users",
      path: "companions",
      select:
        "userId name lastname email phone goal gender birthday height weight workoutLevel",
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Se ha obtenido la lista de compañeros exitosamente.",
      companions: user.companions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

//Actualizacion de token de Firebase Cloud Messaging
router.patch("/updateFcmToken/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { fcmToken } = req.body;

    // Validar el fcmToken
    if (!fcmToken) {
      return res.status(400).send({
        success: false,
        message: "fcmToken es requerido",
      });
    }

    // Buscar el usuario y actualizar el fcmToken
    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      { fcmToken: fcmToken },
      { new: true } // Devuelve el documento modificado
    );

    if (!updatedUser) {
      return res.status(404).send({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "fcmToken actualizado con éxito",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
});

//BUSCADOR DE USUARIOS}
router.get("/search-user", async (req, res) => {
  try {
    const searchQuery = req.query.q;

    // Crear una regex para la búsqueda flexible de nombres
    const nameRegex = new RegExp(searchQuery, "i"); // 'i' para ignorar mayúsculas/minúsculas

    // Buscar por name o userId
    const users = await User.find({
      $or: [
        { name: { $regex: nameRegex } },
        { userId: searchQuery.match(/^\d+$/) ? parseInt(searchQuery) : null },
      ],
    });

    res.json({
      success: true,
      users: users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      success: false,
      message: "Error al procesar la solicitud",
      error: err.message,
    });
  }
});

module.exports = router;
