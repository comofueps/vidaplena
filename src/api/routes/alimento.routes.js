import { Router } from "express";
import {
  createAlimento,
  createAlimentos,
  getAlimentos,
  updateAlimento,
} from "../controllers/alimento.controller.js";

const router = Router();

router.post("/create-alimento", createAlimento);
router.post("/create-alimentos", createAlimentos);
router.get("/alimentos", getAlimentos);
router.put("/alimento/:id", updateAlimento);
// implementar metodo delete

export default router;
