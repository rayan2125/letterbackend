import express from "express";
import Letter from "../models/letterModels.js";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";
import { deleteGoogleDriveFile, updateGoogleDoc, uploadToGoogleDrive } from "../utils/googleDrive.js";
import User from "../models/userModels.js";

const router = express.Router();

// Function to get existing user
const getExistingUser = async (email) => {
    return await User.findOne({ where: { email } });
};
const extractDocumentId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};


// Upload or update a letter
router.post("/upload", ensureAuthenticated, async (req, res) => {
    try {
        const { content, title } = req.body;
        const user = req.user;

        if (!user.googleAccessToken) {
            return res.status(401).json({ message: "Google authentication required" });
        }

        const existingUser = await getExistingUser(user.email);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const googleDocsUrl = await uploadToGoogleDrive(user.googleAccessToken,title,content);
        const letter = await Letter.create({
            userId: existingUser.id,
            title,
            content,
            letterUrl: googleDocsUrl,
        });

        res.json({ message: "Uploaded successfully", url: googleDocsUrl, letter });
    } catch (error) {
        res.status(500).json({ message: "Error uploading letter", error: error.message });
    }
});

// Update letter
// Update letter
router.put("/update/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { content, title } = req.body;
        const existingUser = await getExistingUser(req.user.email);

        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const letter = await Letter.findOne({ where: { id: req.params.id, userId: existingUser.id } });

        if (!letter) {
            return res.status(404).json({ message: "Letter not found" });
        }

        let updatedUrl = letter.letterUrl;

        if (letter.letterUrl && req.user.googleAccessToken) {
            const documentId = extractDocumentId(letter.letterUrl);
            updatedUrl = await updateGoogleDoc(req.user.googleAccessToken, documentId,title,content);
        }

        // Update the letter in the database
        await letter.update({
            title,
            content,
            letterUrl: updatedUrl, // Save the updated URL
        });

        res.json({ message: "Letter updated", letter });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error updating letter", error: error.message });
    }
});


// Get all letters
router.get("/view", ensureAuthenticated, async (req, res) => {
    try {
        const existingUser = await getExistingUser(req.user.email);

        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const letters = await Letter.findAll({
            where: { userId: existingUser.id },
            attributes: ["id", "title", "content", "letterUrl", "createdAt"],
        });

        res.json({ message: "Documents retrieved successfully", letters });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving documents", error: error.message });
    }
});

// Delete letter
router.delete("/delete/:id", ensureAuthenticated, async (req, res) => {
    try {
        const existingUser = await getExistingUser(req.user.email);

        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const letter = await Letter.findOne({ where: { id: req.params.id, userId: existingUser.id } });

        if (!letter) {
            return res.status(404).json({ message: "Letter not found" });
        }

        if (letter.letterUrl && req.user.googleAccessToken) {
            await deleteGoogleDriveFile(req.user.googleAccessToken, letter.letterUrl);
        }

        await letter.destroy();

        res.json({ message: "Letter deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting letter", error: error.message });
    }
});

export default router;
