import dbConnect from "../db.js";
import User from "../models/user.js";
import { authenticate } from "../utils/auth.js";

async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Get current user to check role
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Prevent admin from deleting themselves
    if (currentUser.email === email) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Find and delete user
    const user = await User.findOneAndDelete({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 