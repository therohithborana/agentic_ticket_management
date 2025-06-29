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

    const { id } = req.query;

    // Get current user
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Find ticket
    const ticket = await Ticket.findById(id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("resolvedBy", "email")
      .populate("comments.user", "email");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check access permissions
    if (currentUser.role === "user" && ticket.createdBy._id.toString() !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Filter comments based on user role and visibility settings
    if (currentUser.role === "user") {
      // Users can only see public comments
      ticket.comments = ticket.comments.filter(comment => !comment.isPrivate);
    } else if (currentUser.role === "moderator") {
      // Moderators can see public comments and comments targeted to moderators/admins
      ticket.comments = ticket.comments.filter(comment => 
        !comment.isPrivate || 
        !comment.targetRoles || 
        comment.targetRoles.includes("moderator") ||
        comment.targetRoles.includes("admin")
      );
    }
    // Admins can see all comments

    res.status(200).json({ ticket });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 