import express from "express";
import passport from "passport";

const authRouter = express.Router();

// Google OAuth Routes
authRouter.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("https://letterfornted.vercel.app/dashboard");
    }
);

authRouter.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            googleAccessToken: req.user.googleAccessToken,
        });
    } else {
        res.status(401).json({ message: "Not authenticated" });
    }
});

authRouter.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed", error: err });
        }
        res.clearCookie("connect.sid", { path: "/" });
        res.json({ message: "Logged out successfully" });
    });
});

export default authRouter;
