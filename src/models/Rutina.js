import mongoose from "mongoose";

const rutinaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  calorias_quemadas: { type: Number },
  //descripcion: { type: String },
  ejercicios: [
    {
      nombre: { type: String, required: true },
      repeticiones: { type: Number },
      series: { type: Number },
      peso: { type: Number }, //libras      
      duracion: { type: Number },
    },
  ],
});

export const Rutina = mongoose.model("Rutina", rutinaSchema);
