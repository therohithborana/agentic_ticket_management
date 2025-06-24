import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { createTicket, getTicket, getTickets, addComment, resolveTicket, getModeratorsAndAdmins } from "../controllers/ticket.js";

const router = express.Router();

router.get("/", authenticate, getTickets);
router.get("/moderators-admins", authenticate, getModeratorsAndAdmins);
router.get("/:id", authenticate, getTicket);
router.post("/", authenticate, createTicket);
router.post("/:id/comment", authenticate, addComment);
router.put("/:id/resolve", authenticate, resolveTicket);

export default router;
