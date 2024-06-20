import { User } from "../../models/Usuario.js";
import {
  crearProgreso,
  obtenerProgresoFromUser,
  updateProgreso,
} from "../services/progresoService.js";

export const createDreamToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { quality, startTime, endTime, timeToFallAsleep, date } = req.body;

    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json("Usuario no encontrado.");
    }

    const dateOnly = date
      ? new Date(date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const newDream = {
      quality,
      startTime,
      endTime,
      timeToFallAsleep,
    };

    let { progreso } = await obtenerProgresoFromUser(userId, dateOnly);
    let bandera = false;

    if (!progreso) {
      await crearProgreso(user.weight, user.height, user.userId, dateOnly);
      ({ progreso } = await obtenerProgresoFromUser(userId, dateOnly));
      bandera = true;
    }
    const nuevoProgreso = {
      imc: progreso.imc,
      peso: progreso.peso,
      nivel_peso: progreso.nivel_peso,
      fecha: progreso.fecha,
      calorias_consumidas: progreso.calorias_consumidas || 0,
      calorias_quemadas: progreso.calorias_quemadas || 0,
      balance_calorico: progreso.balance_calorico || 0,
      dream: [newDream],
    };

    await updateProgreso(userId, dateOnly, nuevoProgreso);

    res.status(201).json({
      mensaje:
        bandera === true
          ? "Progreso y registros de sueño creado con éxito"
          : "Registro de sueño actualizado con éxito.",
      progreso: nuevoProgreso,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudo crear el registro de sueño.",
      error: error.message,
    });
  }
};

export const getDataDreamsFromUser = async (req, res) => {
  const { userId, date } = req.params;

  const user = await User.findOne({ userId: userId });

  if (!user) {
    return res.status(404).json("Usuario no encontrado");
  }

  let progreso;
  if (date) {
    progreso = user.progress.find((progress) => progress.fecha === date);
    progreso = progreso ? [progreso] : [];
  } else {
    progreso = user.progress.sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
  }

  if (!progreso || (Array.isArray(progreso) && progreso.length === 0)) {
    return res.status(404).json("No se encontró progreso.");
  }

  const dreamsWithDates = progreso
    .filter((p) => p.dream && p.dream.length > 0)
    .map((p) => ({
      fecha: p.fecha,
      dream: p.dream.map((d) => {
        const startTime = new Date(d.startTime);
        const endTime = new Date(d.endTime);
        const sleepDuration = (endTime - startTime) / (1000 * 60 * 60); // Convert to hours

        return {
          quality: d.quality,
          startTime: d.startTime,
          endTime: d.endTime,
          timeToFallAsleep: d.timeToFallAsleep,
          sleepDuration: sleepDuration.toFixed(2), // Add sleepDuration in hours, rounded to 2 decimal places
        };
      }),
    }));

  return res.status(201).json(dreamsWithDates);
};
