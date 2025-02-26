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
import paymentsRoutes from "./routes/paymentRoutes";
import { Request, Response, NextFunction } from "express";

config();

const app = express();

const env = process.env.ENV;
if (env === undefined || !(env === "dev" || env === "prod")) {
  throw new Error("ENV is not defined in .env file, it must be dev or prod");
}
if (env === "dev") {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(req.method, req.url);
    next();
  });
}
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
    paymentsRoutes(app, connection);
    //to keep db connection active
    //TODO change for connection pool but requires to handle connection release for each connection
    setInterval(async () => await connection.query("SELECT 1"), 10000);
  })
  .catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
