import { Sequelize } from "sequelize";

const sequelize = new Sequelize("mydatabase", "postgres", "your_password", {
  host: "localhost",
  dialect: "postgres", // Specifies PostgreSQL
  logging: false, // Disable logging (optional)
});

export default sequelize;
