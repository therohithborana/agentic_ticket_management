import dbConnect from "../db.js";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import analyzeTicket from "../utils/ai.js";
import { authenticate } from "../utils/auth.js";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    // Get current user
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Create ticket
    const ticket = new Ticket({
      title,
      description,
      createdBy: req.userId,
      status: "open",
    });

    await ticket.save();

    // Analyze ticket with AI (async, don't wait for it)
    try {
      const analysis = await analyzeTicket(ticket);
      
      // Update ticket with AI analysis
      ticket.helpfulNotes = analysis.helpfulNotes;
      ticket.priority = analysis.priority;
      ticket.relatedSkills = analysis.relatedSkills;
      
      await ticket.save();
    } catch (aiError) {
      console.error("AI analysis failed:", aiError);
      // Continue without AI analysis
    }

    // Populate user data
    await ticket.populate("createdBy", "email");

    res.status(201).json({
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 