// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
import mongoose from "mongoose";

const alimentoBaseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: [
      "Proteinas",
      "Carbohidratos",
      "Grasas",
      "Bebidas y Lácteos",
      "Frutas",
      "Verduras",
    ],
    required: true,
  },
  measurementUnits: {
    type: Map,
    of: new mongoose.Schema(
      {
        calorie: { type: Number, required: true },
        protein: { type: Number, required: true },
        carbs: { type: Number, required: true },
        fats: { type: Number, required: true },
      },
      { _id: false }
    ),
    required: true,
  },
});

export const AlimentoBase = mongoose.model(
  "alimentos-base",
  alimentoBaseSchema
);
