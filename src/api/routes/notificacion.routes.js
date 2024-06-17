import { Router } from "express";
import {
  deleteNotification,
  searchNotificationByUserId,
  sendNotification,
  updateNotification,
} from "../controllers/notificacion.controller.js";

const router = Router();

// router.post("/send-invitation");
// router.post("/accept-invitation");
router.post("/send-notification", sendNotification);
router.get("/notifications/:userId", searchNotificationByUserId);
router.patch("/notifications/read/:notificationId", updateNotification);
router.delete("/notifications/:notificationId", deleteNotification);
// router.get("/companions/:userId");
// router.post("/send-notification");

export default router;
