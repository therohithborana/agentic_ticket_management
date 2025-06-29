import dbConnect from "../db.js";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import { authenticate } from "../utils/auth.js";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Get current user
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    let tickets;
    
    // If user is admin or moderator, get all tickets
    if (currentUser.role === "admin" || currentUser.role === "moderator") {
      tickets = await Ticket.find({})
        .populate("createdBy", "email")
        .populate("assignedTo", "email")
        .populate("resolvedBy", "email")
        .sort({ createdAt: -1 });
    } else {
      // If user is regular user, only get their own tickets
      tickets = await Ticket.find({ createdBy: req.userId })
        .populate("createdBy", "email")
        .populate("assignedTo", "email")
        .populate("resolvedBy", "email")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({ tickets });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 