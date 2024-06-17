// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
import mongoose from "mongoose";

// Esquema de Notificación
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users", // Actualiza esto para que coincida con el registro del modelo 'User'
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users", // Actualiza esto para que coincida con el registro del modelo 'User'
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Invitation", "Alert", "Information", "Other"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

export const Notification = mongoose.model("Notification", notificationSchema);

// module.exports = Notification;
