import { Rutina } from "../../models/Rutina.js";
import { User } from "../../models/Usuario.js";
import { calcularCaloriasQuemadas } from "../services/progresoService.js";

export const createRutinaToUser = async (req, res) => {
  try {
    const { userId, rutina, date } = req.body;

    const user = await User.findOne({ userId: userId });

    if (!user) {
      return res.status(404).json("Usuario no encontrado");
    }

    const rutinaEncontrada = await Rutina.findById(rutina);

    if (!rutinaEncontrada) {
      return res.status(404).json("Rutina no encontrada");
    }

    const rutinaNueva = {
      userId: userId,
      rutina: rutina,
      date: date,
    };

    const rutinaAdd = user.rutinas.push(rutinaNueva);
    await user.save();
    res.status(201).json(rutinaAdd);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json("Ingrese un ID válido.");
    }
    res
      .status(500)
      .json({ mensaje: "No se pudo crear la rutina.", error: error.message });
  }
};

export const getRutinas = async (req, res) => {
  try {
    const rutinas = await Rutina.find();
    if (!rutinas) {
      return res.status(404).json("Rutinas no encontradas.");
    }
    res.status(201).json(rutinas);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "No se encontraron rutinas.", error: error.message });
  }
};

export const updateEstadoRutina = async (req, res) => {
  try {
    const { userId, rutinaId } = req.query;

    const user = await User.findOne({ userId: userId }).populate({
      path: "rutinas.rutina",
      model: "Rutina",
    });

    if (!user) {
      return res.status(404).json("Usuario no encontrado");
    }

    const rutinas = user.rutinas.find(
      (rutina) => rutina._id.toString() === rutinaId
    );

    rutinas.estado = "Completada";
    await user.save();
    const fecha = rutinas.fecha.toISOString();

    const fechaSinHora = fecha.split("T")[0];

    const prueba = await calcularCaloriasQuemadas(userId, fechaSinHora);
    console.log(prueba);

    if (!rutinas) {
      return res.status(404).json("Rutina no encontrada");
    }
    res.status(201).json(rutinas);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const createRutina = async (req, res) => {
  try {
    const rutina = new Rutina(req.body);

    await rutina.save();
    res.status(201).json({
      success: true,
      message: "Rutina creada con éxito.",
      rutina,
    });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "No se pudo crear la rutina.", error: error.message });
  }
};

export const getRutinasByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne(
      { userId: userId },
      "name apellido lastname goal rutinas"
    ).populate({
      path: "rutinas.rutina",
      model: "Rutina",
    });
    if (!user) {
      return res.status(404).json("Usuario no encontrado");
    }
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json(error.message);
  }
};
