import { Router } from "express";
import {
  createRutina,
  createRutinaToUser,
  getRutinas,
  getRutinasByUser,
  getRutinasByUserAndDate,
  updateEstadoRutina,
} from "../controllers/rutinas.controller.js";

const router = Router();

router.post("/rutinas", createRutinaToUser);
router.get("/rutinas", getRutinas);
router.get("/rutinas-user/:userId", getRutinasByUser);
router.patch("/update-estado", updateEstadoRutina);
router.post("/create-rutinas", createRutina);
router.get("/rutinas-completadas/:userId/:fecha", getRutinasByUserAndDate);

export default router;
