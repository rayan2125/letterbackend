import axios from "axios";

export const ensureAuthenticated = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    // console.log("is coming:::::", token);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        // Verify token with Google's User Info API
        const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${token}` },
        });

        // console.log("Google User Verified:", data);
// 
        req.user = {
            id: data.sub, // Google user ID
            email: data.email,
            name: data.name,
            picture: data.picture,
        };

        next();
    } catch (error) {
        console.error("Google Token Verification Failed:", error.response?.data || error.message);
        return res.status(401).json({ message: "Unauthorized: Invalid token", error: error.response?.data });
    }
};
