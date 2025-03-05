import express from "express";
import Letter from "../models/letterModels.js";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";
import { deleteGoogleDriveFile, updateGoogleDoc } from "../utils/googleDrive.js";

const router = express.Router();

// Upload a letter to Google Drive
router.post("/upload", ensureAuthenticated, async (req, res) => {
    try {
        console.log(req.body.id)
        const { content,title } = req.body; // Get content from request body
// console.log(req.user.googleAccessToken)
        // if (!req.user.googleAccessToken) {
        //     return res.status(401).json({ message: "Google authentication required" });
        // }

        // If content is not provided, fetch an existing letter
        let letter;
        if (req.body.id) {
            letter = await Letter.findOne({ where: { id: req.body.id,userId: req.user.id } });
            if (!letter) {
                return res.status(404).json({ message: "Letter not found" });
            }
        } else {
            // Create a new letter if no ID is provided
            letter = await Letter.create({ userId: req.user.id,title, content });
        }

        // Upload to Google Drive
        const googleDocsUrl = await uploadToGoogleDrive(req.user.googleAccessToken, letter.content);

        res.json({ message: "Uploaded successfully", url: googleDocsUrl });
    } catch (error) {
        console.log("this error coming:::????",error)
        res.status(500).json({ message: "Error uploading letter", error: error.message });
    }
});

router.put("/update/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;

        const letter = await Letter.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!letter) {
            return res.status(404).json({ message: "Letter not found" });
        }

        // Update letter in database
        letter.content = content;
        await letter.save();

        // If already uploaded, update the Google Docs file
        if (letter.googleFileId && req.user.googleAccessToken) {
            const updatedUrl = await updateGoogleDoc(req.user.googleAccessToken, letter.googleFileId, content);
            return res.json({ message: "Letter updated", url: updatedUrl });
        }

        res.json({ message: "Letter updated locally" });
    } catch (error) {
        res.status(500).json({ message: "Error updating letter", error: error.message });
    }
});
router.delete("/delete/:id", ensureAuthenticated, async (req, res) => {
    try {
        const letter = await Letter.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!letter) {
            return res.status(404).json({ message: "Letter not found" });
        }

        // If uploaded, delete from Google Drive
        if (letter.googleFileId && req.user.googleAccessToken) {
            await deleteGoogleDriveFile(req.user.googleAccessToken, letter.googleFileId);
        }

        // Delete from database
        await letter.destroy();

        res.json({ message: "Letter deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting letter", error: error.message });
    }
});


export default router;
