import { Router } from "express";
import {
  getAllUsers,
  getUser,
  updateUser,
  createUser,
  getCompanions,
  updateFcmToken,
  searchUsers,
  getProgressFromUser,
} from "../controllers/user.controller.js";


const router = Router();

router.get("/users", getAllUsers);
router.get("/user/:userId", getUser);
router.patch("/user/:userId", updateUser);
router.post("/create-user", createUser);
router.get("/companions/:userId", getCompanions);
router.patch("/updateFcmToken/:userId", updateFcmToken);
router.get("/search-user", searchUsers);
router.get("/progress-user/:userId", getProgressFromUser);


export default router;
