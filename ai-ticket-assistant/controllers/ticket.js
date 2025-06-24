import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }
    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

    await inngest.send({
      name: "ticket/created",
      data: {
        ticketId: newTicket._id.toString(),
        title,
        description,
        createdBy: req.user._id.toString(),
      },
    });
    return res.status(201).json({
      message: "Ticket created and processing started",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];
    if (user.role !== "user") {
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }
    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    if (user.role !== "user") {
      ticket = await Ticket.findById(req.params.id)
        .populate("assignedTo", ["email", "_id"])
        .populate("comments.user", ["email", "_id"]);
    } else {
      ticket = await Ticket.findOne({
        createdBy: user._id,
        _id: req.params.id,
      })
        .select("title description status createdAt helpfulNotes relatedSkills comments")
        .populate("comments.user", ["email", "_id"]);
    }

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Filter comments based on user role and targetRoles
    if (ticket.comments) {
      ticket.comments = ticket.comments.filter(comment => {
        // If comment has targetRoles, check if user's role is included
        if (comment.targetRoles && comment.targetRoles.length > 0) {
          return comment.targetRoles.includes(user.role);
        }
        
        // If comment is private and user is not moderator/admin, hide it
        if (comment.isPrivate && user.role === 'user') {
          return false;
        }
        
        // Show all other comments
        return true;
      });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { comment, taggedUsers = [], targetRoles = [], isPrivate = false } = req.body;
    console.log("Received comment request:", { comment, taggedUsers, targetRoles, isPrivate });
    
    if (!comment) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user has permission to comment
    const user = req.user;
    if (user.role === "user" && ticket.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to comment on this ticket" });
    }

    // Validate tagged users (only moderators and admins can tag)
    let validatedTaggedUsers = [];
    if (taggedUsers.length > 0 && (user.role === 'moderator' || user.role === 'admin')) {
      console.log("Validating tagged users:", taggedUsers);
      const taggedUserDocs = await User.find({ 
        email: { $in: taggedUsers },
        role: { $in: ['moderator', 'admin'] }
      });
      validatedTaggedUsers = taggedUserDocs.map(u => u.email);
      console.log("Validated tagged users:", validatedTaggedUsers);
    }

    // Validate target roles (only moderators and admins can set target roles)
    let validatedTargetRoles = [];
    if (targetRoles.length > 0 && (user.role === 'moderator' || user.role === 'admin')) {
      console.log("Validating target roles:", targetRoles);
      const validRoles = ['user', 'moderator', 'admin'];
      validatedTargetRoles = targetRoles.filter(role => validRoles.includes(role));
      console.log("Validated target roles:", validatedTargetRoles);
    }

    const newComment = {
      comment,
      user: user._id,
      createdAt: new Date(),
      taggedUsers: validatedTaggedUsers,
      targetRoles: validatedTargetRoles,
      isPrivate: isPrivate && (user.role === 'moderator' || user.role === 'admin')
    };

    console.log("Creating new comment:", newComment);

    ticket.comments = ticket.comments || [];
    ticket.comments.push(newComment);
    await ticket.save();

    // Populate user info for the new comment
    const populatedTicket = await Ticket.findById(req.params.id)
      .populate("assignedTo", ["email", "_id"])
      .populate("comments.user", ["email", "_id"]);

    return res.status(200).json({ 
      message: "Comment added successfully",
      ticket: populatedTicket
    });
  } catch (error) {
    console.error("Error adding comment", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has permission to resolve tickets
    if (user.role !== "moderator" && user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to resolve tickets" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = "resolved";
    ticket.resolvedBy = user._id;
    ticket.resolvedAt = new Date();
    await ticket.save();

    const populatedTicket = await Ticket.findById(req.params.id)
      .populate("assignedTo", ["email", "_id"])
      .populate("comments.user", ["email", "_id"]);

    return res.status(200).json({ 
      message: "Ticket marked as resolved",
      ticket: populatedTicket
    });
  } catch (error) {
    console.error("Error resolving ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getModeratorsAndAdmins = async (req, res) => {
  try {
    const user = req.user;
    console.log("getModeratorsAndAdmins called by user:", user.email, "role:", user.role);
    
    // Only moderators and admins can fetch this list
    if (user.role !== "moderator" && user.role !== "admin") {
      console.log("User not authorized to fetch moderators and admins");
      return res.status(403).json({ message: "Not authorized" });
    }

    const moderatorsAndAdmins = await User.find({ 
      role: { $in: ['moderator', 'admin'] },
      _id: { $ne: user._id } // Exclude current user
    }).select('email role');

    console.log("Found moderators and admins:", moderatorsAndAdmins);

    return res.status(200).json({ users: moderatorsAndAdmins });
  } catch (error) {
    console.error("Error fetching moderators and admins", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
