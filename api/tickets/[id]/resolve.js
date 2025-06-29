import dbConnect from "../db.js";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import { authenticate } from "../utils/auth.js";

async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { id } = req.query;

    // Get current user
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if user has permission to resolve tickets
    if (currentUser.role !== "admin" && currentUser.role !== "moderator") {
      return res.status(403).json({ error: "Access denied. Moderator or admin role required." });
    }

    // Find and update ticket
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      {
        status: "resolved",
        resolvedBy: req.userId,
        resolvedAt: new Date(),
      },
      { new: true }
    ).populate("createdBy", "email")
     .populate("assignedTo", "email")
     .populate("resolvedBy", "email");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.status(200).json({
      message: "Ticket resolved successfully",
      ticket,
    });
  } catch (error) {
    console.error("Resolve ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 