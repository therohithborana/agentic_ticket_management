import dbConnect from "../db.js";
import User from "../models/user.js";
import { hashPassword } from "../utils/auth.js";
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

    const { email, password, role, skills } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      role: role || "user",
      skills: skills || [],
    });

    await user.save();

    // Return user data (without password)
    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      skills: user.skills,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      message: "User created successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticate(handler); 