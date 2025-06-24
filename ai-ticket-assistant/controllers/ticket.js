import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";

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
      ticket = await Ticket.findById(req.params.id).populate("assignedTo", [
        "email",
        "_id",
      ]);
    } else {
      ticket = await Ticket.findOne({
        createdBy: user._id,
        _id: req.params.id,
      }).select("title description status createdAt helpfulNotes relatedSkills");
    }

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
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

    const newComment = {
      comment,
      user: user._id,
      createdAt: new Date()
    };

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
