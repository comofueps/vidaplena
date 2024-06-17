import mongoose from "mongoose";

const alimentoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Proteinas",
        "Proteínas",
        "Carbohidratos",
        "Grasas",
        "Bebidas y Lácteos",
        "Bebidas",
        "Lácteos",
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
  },
);

export const Alimento = mongoose.model("Alimento", alimentoSchema);
