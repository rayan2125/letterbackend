import axios from "axios";
import User from "../models/userModels.js";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const refreshAccessToken = async (userId) => {
    try {
        // Fetch the user's refresh token from the database
        const user = await User.findOne({ where: { id: userId } });

        if (!user || !user.googleRefreshToken) {
            throw new Error("No refresh token found. User needs to log in again.");
        }

        const response = await axios.post(GOOGLE_TOKEN_URL, {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: user.googleRefreshToken,
            grant_type: "refresh_token",
        });

        const newAccessToken = response.data.access_token;

        // Update the user with the new access token
        await user.update({ googleAccessToken: newAccessToken });

        return newAccessToken;
    } catch (error) {
        console.error("Error refreshing access token:", error.response?.data || error.message);
        throw new Error("Failed to refresh access token");
    }
};
