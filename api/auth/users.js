import dbConnect from "../db.js";
import User from "../models/user.js";
import { authenticate } from "../utils/auth.js";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Get current user to check role
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    // Get all users (excluding passwords)
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 