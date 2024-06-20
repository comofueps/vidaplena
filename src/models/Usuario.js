import mongoose from "mongoose";

// Definir el esquema de progreso

const dreamSchema = new mongoose.Schema(
  {
    quality: {
      type: String,
      enum: ["Bueno", "Regular", "Malo"],
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timeToFallAsleep: { type: Number, required: true }, // tiempo en conciliar el sueño
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    imc: { type: Number },
    peso: { type: Number },
    nivel_peso: {
      type: String,
      enum: [
        "Bajo Peso",
        "Peso Normal",
        "Sobrepeso",
        "Obesidad tipo I",
        "Obesidad tipo II",
        "Obesidad tipo III",
      ],
      required: true,
    },
    dream: [dreamSchema],
    fecha: { type: String, index: true, unique: true },
    calorias_quemadas: { type: Number },
    calorias_consumidas: { type: Number },
    balance_calorico: { type: Number },
  },
  { _id: false }
);

const foodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"],
  },
  alimentos: [
    {
      alimento: { type: mongoose.Schema.Types.ObjectId, ref: "Alimento" },
      cantidad: { type: Number, required: true }, // Puede ser en gramos, unidades, etc.
      unidadMedida: { type: String, required: true },
      containsSugar: { type: Boolean, default: false },
    },
  ],
});

const dailyFoodSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // Fecha de la comida
  meals: [foodSchema], // Comidas del día
});

const usuarioRutinaSchema = new mongoose.Schema({
  rutina: { type: mongoose.Schema.Types.ObjectId, ref: "Rutina" },
  fecha: { type: Date, default: Date.now },
  estado: {
    type: String,
    enum: ["Asignada", "Completada"],
    default: "Asignada",
  },
});

// Definir el esquema del usuario
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true },
  profilePicture: { type: String },
  userId: { type: Number, required: true, index: true },
  goal: {
    type: String,
    enum: ["Perder Peso", "Mantener Peso", "Ganar Masa Muscular"],
    required: true,
  },
  gender: { type: String, enum: ["Hombre", "Mujer", "Otro"], required: true },
  birthday: { type: String, required: true },
  height: { type: String, required: true }, // En centímetros
  weight: { type: String, required: true }, // En kilogramos
  workoutLevel: {
    type: String,
    enum: ["Sedentario", "Ligero", "Moderado", "Alto", "Atleta"],
    required: true,
  },
  fcmToken: { type: String, required: true },
  dailyFoods: [dailyFoodSchema],
  availableFood: [
    {
      alimento: { type: mongoose.Schema.Types.ObjectId, ref: "Alimento" },
    },
  ],
  wishFood: [
    {
      alimento: { type: mongoose.Schema.Types.ObjectId, ref: "Alimento" },
    },
  ],
  foodAllergies: [
    {
      alimento: { type: mongoose.Schema.Types.ObjectId, ref: "Alimento" },
    },
  ],
  medicationAllergies: [{ name: { type: String } }],
  diseases: [{ name: { type: String } }],
  active: { type: Boolean, default: true, required: true },
  companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  progress: [progressSchema],
  rutinas: [usuarioRutinaSchema],
});

// Crear el modelo
userSchema.index({ userId: 1 });
export const User = mongoose.model("users", userSchema);
