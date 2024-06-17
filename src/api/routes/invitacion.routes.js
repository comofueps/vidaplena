import { Router } from "express";
import {
  sendInvitation,
  acceptInvitation,
} from "../controllers/invitacion.controller.js";

const router = Router();

router.post("/send-invitation", sendInvitation);
router.post("/accept-invitation", acceptInvitation);

export default router;
