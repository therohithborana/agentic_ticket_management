import dbConnect from "../db.js";
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

    // Check if user has permission
    if (currentUser.role !== "admin" && currentUser.role !== "moderator") {
      return res.status(403).json({ error: "Access denied. Moderator or admin role required." });
    }

    // Get moderators and admins (excluding passwords)
    const users = await User.find(
      { role: { $in: ["moderator", "admin"] } },
      { password: 0 }
    ).sort({ role: 1, email: 1 });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Get moderators and admins error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 