import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/db";
import { seedAdmin } from "./modules/auth/auth.seeding";
import http from "http";
import { initSocket } from "./socket";

dotenv.config();

const PORT = process.env.PORT || 4000;


(async () => {
  try {
    await connectDB();
    await seedAdmin();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}/swagger/`);
      console.log(`📡 Socket.io Service Ready`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
})();