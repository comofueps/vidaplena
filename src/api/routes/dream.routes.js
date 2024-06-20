import { Router } from "express";
import {
  createDreamToUser,
  getDataDreamsFromUser,
} from "../controllers/dream.controller.js";

const router = Router();

router.post("/add-dream/:userId", createDreamToUser);
router.get("/get-dream/:userId/:date?", getDataDreamsFromUser);

export default router;
