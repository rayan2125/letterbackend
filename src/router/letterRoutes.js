import express from "express";
import Letter from "../models/letterModels.js";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";
import { deleteGoogleDriveFile, updateGoogleDoc, uploadToGoogleDrive } from "../utils/googleDrive.js";
import User from "../models/userModels.js";

const router = express.Router();

// Upload a letter to Google Drive
router.post("/upload", ensureAuthenticated, async (req, res) => {
    const userAccessToken = req;
   let access_token="ya29.a0AeXRPp43o32MAwZ0KxgHqStPchvtXmchKIoGPLVkoUUAEYZv023S6OOoCMZflK3gTnqhF9erfO1x1EMeN55xwLfcFvW0MQngAhRUdGsXLT4ItGk38GGr3WA1eopaOzm9HDstvd8ywUtBNNGCPvMO_nWhFZFQS0c4MHjkitPbaCgYKATsSARMSFQHGX2Mis_uiVpUFoCblNA6Bb0TvVw0175"
    try {
        // console.log("im just checking:::",req)
        let {user} = req
        const { content,title } = req.body; // Get content from request body
// console.log(req.user.googleAccessToken)
        // if (!req.user.googleAccessToken) {
        //     return res.status(401).json({ message: "Google authentication required" });
        // }

        // If content is not provided, fetch an existing letter
        const exitingUser = await User.findOne({ where: { email: user.email } });
        console.log(exitingUser)

        // let letter;
        // if (req.body.id) {
        //     letter = await Letter.findOne({ where: { id: req.body.id,userId: req.user.id } });
        //     if (!letter) {
        //         return res.status(404).json({ message: "Letter not found" });
        //     }
        // } else {
        //     // Create a new letter if no ID is provided
        //     letter = await Letter.create({ userId: exitingUser.id,title, content });
        // }

        // Upload to Google Drive
        const googleDocsUrl = await uploadToGoogleDrive(access_token, content);

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








// File uploaded! File URL: https://docs.google.com/document/d/14Jm6fQTk_FkkLEUHQ0iuXZvHG_sqff9XWyCAM24I5fY/edit