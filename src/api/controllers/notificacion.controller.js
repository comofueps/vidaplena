import { Notification } from "../../models/Notification.js";
import { User } from "../../models/Usuario.js";
import admin from "../services/firebase.js";



export const searchNotificationByUserId = async (req, res) => {
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
};

export const updateNotification = async (req, res) => {
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
};

export const deleteNotification = async (req, res) => {
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
};

export const sendNotification = async (req, res) => {
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
};

//añadir los demás metodos
