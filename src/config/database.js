import { Sequelize } from "sequelize";


import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },})
// const sequelize = new Sequelize("mydatabase", "postgres", "your_password", {
//   host: "localhost",
//   dialect: "postgres", // Specifies PostgreSQL
//   logging: false, // Disable logging (optional)
// });

export default sequelize;
