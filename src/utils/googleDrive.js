import { google } from "googleapis";

// Initialize OAuth2 client with environment variables
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV==="production"? process.env.PRODUCTION_URL:process.env.LOCAL_URL
);

// Function to set credentials
const setAuthCredentials = (accessToken) => {
  oauth2Client.setCredentials({ access_token: accessToken });
};

// 🔹 Upload a new document to Google Drive
export const uploadToGoogleDrive = async (accessToken,title, content) => {
    const { data } = await oauth2Client.getTokenInfo(accessToken);

  try {
    setAuthCredentials(accessToken);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: title,
      mimeType: "application/vnd.google-apps.document",
    };

    const media = {
      mimeType: "text/plain",
      body: content,
    };
    
    const file = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id",
    });
    return `https://docs.google.com/document/d/${file.data.id}/edit`;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

// 🔹 Update an existing Google Doc
export const updateGoogleDoc = async (accessToken, documentId, newText) => {
  try {
    setAuthCredentials(accessToken);

    const docs = google.docs({ version: "v1", auth: oauth2Client });

    const requests = [
      {
        insertText: {
          location: { index: 1 },
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

// 🔹 Delete a file from Google Drive
export const deleteGoogleDriveFile = async (accessToken, fileId) => {
  try {
    setAuthCredentials(accessToken);

    // Extract file ID if full URL is provided
    const extractedFileId = fileId.includes("docs.google.com")
      ? fileId.split("/d/")[1].split("/")[0]
      : fileId;

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    await drive.files.delete({ fileId: extractedFileId });

    return "File deleted successfully";
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};


  