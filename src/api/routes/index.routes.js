import { Router } from "express";
import userRoutes from "./user.routes.js";
import alimentoRoutes from "./alimento.routes.js";
import comidasRoutes from "./comidas.routes.js";
import alimentosbaseRoutes from "./alimentosbase.routes.js";
import notificacionRoutes from "./notificacion.routes.js";
import invitacionRoutes from "./invitacion.routes.js";
import rutinasRoutes from "./rutinas.routes.js";
import dreamRoutes from "./dream.routes.js";

const router = Router();

router.use("", userRoutes);
router.use("", alimentoRoutes);
router.use("", comidasRoutes);
router.use("", alimentosbaseRoutes);
router.use("", notificacionRoutes);
router.use("", invitacionRoutes);
router.use("", rutinasRoutes);
router.use("", dreamRoutes);

export default router;
