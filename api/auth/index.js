import dbConnect from "../db.js";
import User from "../models/user.js";
import { hashPassword, comparePassword, generateToken, authenticate } from "../utils/auth.js";

// Helper function to check admin role
const checkAdminRole = async (userId) => {
  const currentUser = await User.findById(userId);
  return currentUser && currentUser.role === "admin";
};

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
      case "POST":
        // Handle different POST operations based on path
        if (req.url.includes("/signup")) {
          return handleSignup(req, res);
        } else if (req.url.includes("/login")) {
          return handleLogin(req, res);
        } else if (req.url.includes("/create-user")) {
          return handleCreateUser(req, res);
        } else if (req.url.includes("/update-user")) {
          return handleUpdateUser(req, res);
        } else {
          return res.status(404).json({ error: "Endpoint not found" });
        }

      case "GET":
        if (req.url.includes("/users")) {
          return handleGetUsers(req, res);
        } else {
          return res.status(404).json({ error: "Endpoint not found" });
        }

      case "DELETE":
        if (req.url.includes("/delete-user")) {
          return handleDeleteUser(req, res);
        } else {
          return res.status(404).json({ error: "Endpoint not found" });
        }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Signup handler
async function handleSignup(req, res) {
  const { email, password } = req.body;

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
    role: "user",
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Return user data (without password) and token
  const userData = {
    _id: user._id,
    email: user.email,
    role: user.role,
    skills: user.skills,
    createdAt: user.createdAt,
  };

  return res.status(201).json({
    message: "User created successfully",
    token,
    user: userData,
  });
}

// Login handler
async function handleLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Check password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate token
  const token = generateToken(user._id);

  // Return user data (without password) and token
  const userData = {
    _id: user._id,
    email: user.email,
    role: user.role,
    skills: user.skills,
    createdAt: user.createdAt,
  };

  return res.status(200).json({
    message: "Login successful",
    token,
    user: userData,
  });
}

// Get users handler (admin only)
async function handleGetUsers(req, res) {
  // Authenticate and check admin role
  const authResult = await authenticate(async (req, res) => {
    const isAdmin = await checkAdminRole(req.userId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    // Get all users (excluding passwords)
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    return res.status(200).json(users);
  })(req, res);

  return authResult;
}

// Create user handler (admin only)
async function handleCreateUser(req, res) {
  // Authenticate and check admin role
  const authResult = await authenticate(async (req, res) => {
    const isAdmin = await checkAdminRole(req.userId);
    if (!isAdmin) {
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

    return res.status(201).json({
      message: "User created successfully",
      user: userData,
    });
  })(req, res);

  return authResult;
}

// Update user handler (admin only)
async function handleUpdateUser(req, res) {
  // Authenticate and check admin role
  const authResult = await authenticate(async (req, res) => {
    const isAdmin = await checkAdminRole(req.userId);
    if (!isAdmin) {
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

    return res.status(200).json({
      message: "User updated successfully",
      user,
    });
  })(req, res);

  return authResult;
}

// Delete user handler (admin only)
async function handleDeleteUser(req, res) {
  // Authenticate and check admin role
  const authResult = await authenticate(async (req, res) => {
    const isAdmin = await checkAdminRole(req.userId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get current user to prevent self-deletion
    const currentUser = await User.findById(req.userId);
    if (currentUser.email === email) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Find and delete user
    const user = await User.findOneAndDelete({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  })(req, res);

  return authResult;
} 