import dbConnect from "../db.js";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import analyzeTicket from "../utils/ai.js";
import { authenticate } from "../utils/auth.js";

// Helper function to check moderator/admin role
const checkModeratorRole = async (userId) => {
  const currentUser = await User.findById(userId);
  return currentUser && (currentUser.role === "admin" || currentUser.role === "moderator");
};

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case "GET":
        // Handle different GET operations based on path
        if (req.url.includes("/moderators-admins")) {
          return handleGetModeratorsAdmins(req, res);
        } else if (req.url.includes("/api/tickets/") && req.url.split("/").length > 3) {
          // This is a specific ticket ID request
          return handleGetTicket(req, res);
        } else {
          // This is the main tickets list
          return handleGetTickets(req, res);
        }

      case "POST":
        if (req.url.includes("/api/tickets/") && req.url.includes("/comment")) {
          return handleAddComment(req, res);
        } else {
          return handleCreateTicket(req, res);
        }

      case "PUT":
        if (req.url.includes("/resolve")) {
          return handleResolveTicket(req, res);
        } else {
          return res.status(404).json({ error: "Endpoint not found" });
        }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Tickets error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get all tickets
async function handleGetTickets(req, res) {
  const authResult = await authenticate(async (req, res) => {
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

    return res.status(200).json({ tickets });
  })(req, res);

  return authResult;
}

// Get specific ticket
async function handleGetTicket(req, res) {
  const authResult = await authenticate(async (req, res) => {
    // Extract ticket ID from URL
    const urlParts = req.url.split("/");
    const ticketId = urlParts[urlParts.length - 1];

    // Get current user
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Find ticket
    const ticket = await Ticket.findById(ticketId)
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

    return res.status(200).json({ ticket });
  })(req, res);

  return authResult;
}

// Create ticket
async function handleCreateTicket(req, res) {
  const authResult = await authenticate(async (req, res) => {
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

    return res.status(201).json({
      message: "Ticket created successfully",
      ticket,
    });
  })(req, res);

  return authResult;
}

// Add comment to ticket
async function handleAddComment(req, res) {
  const authResult = await authenticate(async (req, res) => {
    // Extract ticket ID from URL
    const urlParts = req.url.split("/");
    const ticketId = urlParts[urlParts.length - 2]; // Before "comment"

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
    const ticket = await Ticket.findById(ticketId);
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

    return res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
    });
  })(req, res);

  return authResult;
}

// Resolve ticket
async function handleResolveTicket(req, res) {
  const authResult = await authenticate(async (req, res) => {
    // Extract ticket ID from URL
    const urlParts = req.url.split("/");
    const ticketId = urlParts[urlParts.length - 2]; // Before "resolve"

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
      ticketId,
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

    return res.status(200).json({
      message: "Ticket resolved successfully",
      ticket,
    });
  })(req, res);

  return authResult;
}

// Get moderators and admins
async function handleGetModeratorsAdmins(req, res) {
  const authResult = await authenticate(async (req, res) => {
    // Get current user
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if user has permission
    if (currentUser.role !== "admin" && currentUser.role !== "moderator") {
      return res.status(403).json({ error: "Access denied. Moderator or admin role required." });
    }

    // Get moderators and admins (excluding passwords)
    const users = await User.find(
      { role: { $in: ["moderator", "admin"] } },
      { password: 0 }
    ).sort({ role: 1, email: 1 });

    return res.status(200).json({ users });
  })(req, res);

  return authResult;
} 