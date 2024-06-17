import { Router } from "express";

import {
  createAlimentoBase,
  getAlimentosBase,
  IacreateAlimentos,
} from "../controllers/alimentobase.controller.js";

const router = Router();

router.post("/create-alimentos-base", createAlimentoBase);
router.get("/alimentos-base", getAlimentosBase);
router.post("/ia-create-food", IacreateAlimentos);

export default router;
