import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorMiddleware } from "./common/middleware/errorMiddleware";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/v1", routes);
app.use(errorMiddleware);