import { google } from "googleapis";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "./models/userModels.js";


dotenv.config();

export const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // "http://localhost:8070/auth/google/callback"
    process.env.NODE_ENV==="production"? process.env.PRODUCTION_URL:process.env.LOCAL_URL
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:process.env.NODE_ENV==="production"? process.env.PRODUCTION_URL:process.env.LOCAL_URL,
            // callbackURL:'http://localhost:8070/auth/google/callback',
            scope: [
                "profile", 
                "email", 
                "https://www.googleapis.com/auth/drive.file", 
                "https://www.googleapis.com/auth/documents" 
            ],
            accessType: "offline", 
            prompt: "consent", 
        },
        
        async (accessToken, refreshToken, profile, done) => {
    
            try {
                let user = await User.findOne({ where: { email: profile.emails[0].value } });
                if (!user) {
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googleRefreshToken: refreshToken,
                    });
                } else {
                    user.googleAccessToken = accessToken;
                    if (refreshToken) {
                        user.googleRefreshToken = refreshToken;
                    }
                    await user.save();
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);



passport.serializeUser((user, done) => {
    done(null, { id: user.id, googleAccessToken: user.googleAccessToken });
});

passport.deserializeUser(async (obj, done) => {
    try {
        const user = await User.findByPk(obj.id);
        if (!user) {
            return done(new Error("User not found"), null);
        }
        user.googleAccessToken = obj.googleAccessToken;
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
