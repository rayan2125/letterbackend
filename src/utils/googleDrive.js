import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(); // Initialize OAuth2 client

const docs = google.docs({ version: "v1", auth: oauth2Client });

export const updateGoogleDoc = async (accessToken, documentId, newText) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const requests = [
      {
        insertText: {
          location: { index: 1 }, // Insert at the beginning
          text: newText,
        },
      },
    ];

    await docs.documents.batchUpdate({
      documentId,
      resource: { requests },
    });

    return `https://docs.google.com/document/d/${documentId}/edit`;
  } catch (error) {
    console.error("Error updating Google Doc:", error);
    throw error;
  }
};

export const deleteGoogleDriveFile = async (accessToken, fileId) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    await drive.files.delete({ fileId });

    return "File deleted successfully";
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
