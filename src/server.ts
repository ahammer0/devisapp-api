import express from "express";
import fileUpload from "express-fileupload";
import cors from "cors";
import mysql from "promise-mysql";
import { config } from "dotenv";

import quotesRoutes from "./routes/quotesRoutes";
import userRoutes from "./routes/userRoutes";
import ticketsRoutes from "./routes/ticketsRoutes";
import workRoutes from "./routes/workRoutes";
import adminRoutes from "./routes/adminRoutes";

config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

const port = process.env.PORT || 3000;
mysql
  .createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "3306"),
  })
  .then((connection) => {
    console.log("Database connected");
    quotesRoutes(app, connection);
    userRoutes(app, connection);
    workRoutes(app, connection);
    adminRoutes(app, connection);
    ticketsRoutes(app, connection);
  })
  .catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
