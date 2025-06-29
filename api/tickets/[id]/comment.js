import dbConnect from "../db.js";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import { authenticate } from "../utils/auth.js";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { id } = req.query;
    const { comment, taggedUsers, targetRoles, isPrivate } = req.body;

    if (!comment) {
      return res.status(400).json({ error: "Comment is required" });
    }

    // Get current user
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Find ticket
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check access permissions
    if (currentUser.role === "user" && ticket.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create comment object
    const commentObj = {
      comment,
      user: req.userId,
      createdAt: new Date(),
      taggedUsers: taggedUsers || [],
      targetRoles: targetRoles || [],
      isPrivate: isPrivate || false,
    };

    // Add comment to ticket
    ticket.comments.push(commentObj);
    await ticket.save();

    // Populate user data for the new comment
    await ticket.populate("comments.user", "email");

    // Get the newly added comment
    const newComment = ticket.comments[ticket.comments.length - 1];

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 