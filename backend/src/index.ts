import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db/client";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
