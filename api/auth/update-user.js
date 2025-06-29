import dbConnect from "../db.js";
import User from "../models/user.js";
import { authenticate } from "../utils/auth.js";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Get current user to check role
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    const { email, role, skills } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email },
      { role, skills },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 