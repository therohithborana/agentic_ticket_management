import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  comment: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  taggedUsers: [String], // Array of email addresses of tagged moderators/admins
  targetRoles: [String], // Array of roles that can see this comment (e.g., ['moderator', 'admin'])
  isPrivate: { type: Boolean, default: false } // If true, only targetRoles can see
});

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: "TODO" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  priority: String,
  deadline: Date,
  helpfulNotes: String,
  relatedSkills: [String],
  comments: [commentSchema],
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", ticketSchema);
