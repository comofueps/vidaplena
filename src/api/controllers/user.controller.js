//import User from "../../models/Usuario.js";
import { User } from "../../models/Usuario.js";
import {
  calcularImc,
  crearProgreso,
  obtenerProgresoFromUser,
  updateProgreso,
} from "../services/progresoService.js";

export const getAllUsers = async (req, res) => {
  try {
    const usuarios = await User.find();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).send("Error al obtener los usuarios: " + error.message);
  }
};

export const getUser = async (req, res) => {
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
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body; // Objeto con los campos a actualizar

    let usuario = await User.findOne({ userId: userId });
    if (!usuario) {
      return res.status(404).send("Usuario no encontrado");
    }

    if (updateData.weight || updateData.height) {
      const peso = updateData.weight ? updateData.weight : usuario.weight;
      const altura = updateData.height ? updateData.height : usuario.height;
      const fecha = new Date(Date.now()).toISOString();
      const fechaSinHora = fecha.split("T")[0];

      const { progreso } = await obtenerProgresoFromUser(userId, fechaSinHora);

      if (progreso) {
        const { imc, nivel_peso } = await calcularImc(peso, altura);

        const nuevoProgreso = {
          imc: imc,
          peso: peso,
          nivel_peso: nivel_peso,
          fecha: progreso.fecha,
          calorias_consumidas: progreso.calorias_consumidas || 0,
          calorias_quemadas: progreso.calorias_quemadas || 0,
          balance_calorico: progreso.balance_calorico || 0,
        };
        await updateProgreso(userId, fechaSinHora, nuevoProgreso);
      } else {
        await crearProgreso(peso, altura, userId);
      }
    }

    usuario = await User.findOneAndUpdate({ userId: userId }, updateData, {
      new: true,
    });

    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).send("Error al actualizar el usuario: " + error.message);
  }
};

export const createUser = async (req, res) => {
  const { height, weight, userId } = req.body;
  try {
    // Buscar el usuario por userId
    let usuario = await User.findOne({ userId: req.body.userId });

    if (usuario) {
      // Actualizar el usuario existente
      usuario = await User.findOneAndUpdate(
        { userId: req.body.userId },
        req.body,
        { new: true }
      );

      await crearProgreso(weight, height, userId);
      usuario.progress = progress;

      res.status(200).json({
        success: true,
        message: "Usuario actualizado con éxito.",
        usuario,
      });
    } else {
      // Crear un nuevo usuario
      usuario = new User(req.body);
      await usuario.save();
      const progress = await crearProgreso(weight, height, userId);
      usuario.progress = progress;
      res.status(201).json({
        success: true,
        message: "Usuario creado con éxito.",
        usuario,
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(404).json({
        mensaje: "No se pudo crear el usuario",
        error: "El email y/o telefono ingresado ya existe en la base de datos.",
      });
    }
    res.status(500).json({
      mensaje: "No se pudo crear el usuario.",
      error: error.message,
      error2: error.name,
    });
  }
};

export const getProgressFromUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fecha } = req.query;

    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json("Usuario no encontrado");
    }
    let progreso;

    if (fecha) {
      progreso = user.progress.find((progress) => progress.fecha === fecha);
    } else {
      progreso = user.progress;
    }

    if (!progreso) {
      return res.status(404).json("No se encontró progreso.");
    }

    res.status(201).json(progreso);

    //const user = await User.findOne(progress.fecha:fecha)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCompanions = async (req, res) => {
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
};

export const updateFcmToken = async (req, res) => {
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
};

export const searchUsers = async (req, res) => {
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
};
