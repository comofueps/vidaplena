import { Notification } from "../../models/Notification.js";
import { User } from "../../models/Usuario.js";
import admin from "../services/firebase.js";


export const sendInvitation = async (req, res) => {
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
};

export const acceptInvitation = async (req, res) => {
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
};
