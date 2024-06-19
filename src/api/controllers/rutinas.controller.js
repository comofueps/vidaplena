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
      fecha: date,
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

export const getRutinasByUserAndDate = async (req, res) => {
  try {
    const { userId, fecha } = req.params;

    // Imprimir la fecha y el userId para depuración
    console.log(`Fecha recibida: ${fecha}`);
    console.log(`Usuario ID recibido: ${userId}`);

    // Verificar que la fecha es válida
    const fechaFiltro = new Date(fecha);
    if (isNaN(fechaFiltro.getTime())) {
      return res.status(400).json({ mensaje: "Formato de fecha inválido" });
    }

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

    // Depurar estructura de los datos de rutinas
    console.log("Estructura de rutinas:", user.rutinas);

    // Filtrar las rutinas por fecha y estado completada
    const rutinasFiltradas = user.rutinas.filter((r) => {
      if (!r.fecha) {
        console.warn(`Rutina sin fecha: ${r}`);
        return false;
      }
      const rutinaFecha = new Date(r.fecha);
      return (
        rutinaFecha.toISOString().split("T")[0] ===
          fechaFiltro.toISOString().split("T")[0] && r.estado === "Completada"
      );
    });

    res.status(200).json({
      userId: user.userId,
      name: user.name,
      apellido: user.apellido,
      lastname: user.lastname,
      goal: user.goal,
      rutinas: rutinasFiltradas,
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message, error: error.name });
  }
};
