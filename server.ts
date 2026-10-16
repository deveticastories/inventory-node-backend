import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./src/config/db";
import { seedSuperAdmin } from "./src/seed/seedSuperAdmin";

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    await connectDB();

    await seedSuperAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();