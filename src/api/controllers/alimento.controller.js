import { Alimento } from "../../models/Alimento.js";

export const getAlimentos = async (req, res) => {
  try {
    const alimentos = await Alimento.find();
    res.status(200).json(alimentos);
  } catch (error) {
    res.status(500).send("Error al obtener los alimentos: " + error.message);
  }
};

export const createAlimento = async (req, res) => {
  try {
    // Buscar si el alimento ya existe
    const alimentoExistente = await Alimento.findOne({ name: req.body.name });

    if (alimentoExistente) {
      return res.status(409).json({
        // Código 409 para conflicto
        success: false,
        message: "El alimento ya existe en la base de datos.",
      });
    }

    // Si no existe, crear un nuevo alimento
    const alimento = new Alimento(req.body);
    const alimentoGuardado = await alimento.save();

    res.status(201).json({
      success: true,
      message: "Alimento creado con éxito.",
      alimento: alimentoGuardado,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

export const createAlimentos = async (req, res) => {
  try {
    // Asegúrate de que la entrada es un array
    if (!Array.isArray(req.body)) {
      return res.status(400).send({
        success: false,
        message: "Se espera un array de alimentos",
      });
    }

    // Iterar sobre el array y guardar cada alimento si no existe
    const alimentosGuardados = [];
    for (const alimentoData of req.body) {
      let alimento = await Alimento.findOne({ name: alimentoData.name });

      if (!alimento) {
        alimento = new Alimento(alimentoData);
        const alimentoGuardado = await alimento.save();
        alimentosGuardados.push(alimentoGuardado);
      }
    }

    // Enviar respuesta con todos los alimentos guardados o existentes
    res.status(201).json({
      success: true,
      message: "Alimentos procesados correctamente.",
      alimentos: alimentosGuardados,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

export const updateAlimento = async (req, res) => {
  try {
    const alimentoActualizado = await Alimento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(alimentoActualizado);
  } catch (error) {
    res.status(500).send("Error al actualizar el alimento: " + error.message);
  }
};

export const deleteAlimento = async (req, res) => {
  try {
    await Alimento.findByIdAndDelete(req.params.id);
    res.status(200).send("Alimento eliminado con éxito");
  } catch (error) {
    res.status(500).send("Error al eliminar el alimento: " + error.message);
  }
};
