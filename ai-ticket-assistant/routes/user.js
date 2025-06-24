import express from "express";
import {
  getUsers,
  login,
  signup,
  updateUser,
  logout,
  deleteUser,
  createUser,
} from "../controllers/user.js";

import { authenticate } from "../middlewares/auth.js";
const router = express.Router();

router.post("/create-user", authenticate, createUser);
router.post("/update-user", authenticate, updateUser);
router.get("/users", authenticate, getUsers);
router.delete("/delete-user", authenticate, deleteUser);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;
