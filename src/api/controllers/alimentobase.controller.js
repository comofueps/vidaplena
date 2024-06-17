import { AlimentoBase } from "../../models/AlimentoBase.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export const createAlimentoBase = async (req, res) => {
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
      let alimento = await AlimentoBase.findOne({ name: alimentoData.name });

      if (!alimento) {
        alimento = new AlimentoBase(alimentoData);
        await alimento.save();
        alimentosGuardados.push(alimento);
      }
    }

    // Enviar respuesta con todos los alimentos guardados
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

export const getAlimentosBase = async (req, res) => {
  try {
    const alimentos = await AlimentoBase.find();
    res.status(200).json(alimentos);
  } catch (error) {
    res.status(500).send("Error al obtener los alimentos: " + error.message);
  }
};

export const IacreateAlimentos = async (req, res) => {
  try {
    const prompt = req.query.text;
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, message: "No se proporcionó texto" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log(text);
    res.status(200).json({ success: true, message: text });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al procesar la solicitud" });
  }
};
