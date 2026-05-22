import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import aiRoutes from "./routes/aiRoutes.js";
import questionsRoutes from "./routes/questionsRoutes.js";
import { registerHandlers } from "./game/handlers.js";

const PORT = Number(process.env.PORT) || 5000;

const origins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origins.includes(origin) || origins.includes("*")) return cb(null, true);
    cb(new Error(`CORS: ${origin} ruxsatsiz`));
  },
  methods: ["GET", "POST", "OPTIONS"],
}));
app.use(express.json({ limit: "1mb" }));

app.use("/api/ai", aiRoutes);
app.use("/api/questions", questionsRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.get("/", (_req, res) => res.send("MathQuizz Backend Running"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: origins.length === 1 && origins[0] === "*" ? true : origins,
    methods: ["GET", "POST"],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

io.on("connection", (socket) => {
  registerHandlers(io, socket);
});

server.listen(PORT, () => {
  console.log(`\n  MathQuizz backend running`);
  console.log(`  http://localhost:${PORT}/api/health\n`);
});
