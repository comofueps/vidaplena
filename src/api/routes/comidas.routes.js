import { Router } from "express";
import {
  createComidas,
  getComidaByDate,
  getComidasByDateRange,
  getComidasFromUsers,
  searchComida,
  deleteComida,
} from "../controllers/comidas.controller.js";

const router = Router();

router.post("/food", createComidas);
router.get("/food", getComidasFromUsers);
router.get("/foodByDateRange", getComidasByDateRange);
router.get("/foodByDate", getComidaByDate);
router.delete("/food", deleteComida);
router.get("/search", searchComida);

export default router;
