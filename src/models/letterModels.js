import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./userModels.js";

const Letter = sequelize.define("Letter", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,  // Stores the letter text
        allowNull: false,
    },
    letterUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
        
        onDelete: "CASCADE",
    },
});

User.hasMany(Letter, { foreignKey: "userId", onDelete: "CASCADE" });
Letter.belongsTo(User, { foreignKey: "userId" });

export default Letter;
