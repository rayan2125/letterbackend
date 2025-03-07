import express from "express";
import sequelize from "./config/database.js";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import User from "./models/userModels.js";
import "./auth.js"; // Import Passport setup
import router from "./router/letterRoutes.js";
import authRouter from "./router/authRouter.js";
import jwt from "jsonwebtoken"
import { oauth2Client } from "./auth.js";
const app = express();
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: "hshnanajnsnsjsj",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "Lax",
    },
  })
);

app.use(passport.initialize());
// app.use(passport.session());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use('/api', router)
app.use('/api', authRouter)
// PostgreSQL Connection
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully! ✅");

    await sequelize.sync(); // Sync models with DB
    console.log("Database synced! ✅");

    // Start server only after DB is connected
    app.listen(8070, () => console.log("Server running on http://localhost:8070"));
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}
// https://letterbackend.onrender.com
// Google OAuth Routes
app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file",]
  , accessType: 'offline',
  prompt: 'consent'

}));

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info from Google
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await response.json();

    if (!googleUser.email) {
      return res.redirect("http://localhost:3000/auth/signup");
    }

    // Check if the user already exists in the database
    let user = await User.findOne({ where: { email: googleUser.email } });

    if (!user) {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleRefreshToken: tokens.refresh_token,
      });
    } else {
      user.googleAccessToken = tokens.access_token;
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }
      await user.save();
    }

    // Store access token in cookies
    res.cookie("authToken", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Redirect to dashboard
    res.redirect("http://localhost:3000/dashboard");
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.redirect("http://localhost:3000/auth/signup");
  }
});


app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      googleAccessToken: req.user.googleAccessToken, // Send access token to frontend
    });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});


app.get("/logout", (req, res) => {
  console.log(req)
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed", error: err });
    }
    res.clearCookie("connect.sid", { path: "/" }); // Ensure session cookie is removed
    res.json({ message: "Logged out successfully" }); // Send JSON response
  });
});
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

app.get('/debug-env', (req, res) => {
  res.json({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
  });
});

// Start Server
startServer();
