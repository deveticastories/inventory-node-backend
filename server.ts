
import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./src/config/db.js";
import { seedSuperAdmin } from "./src/seed/seedSuperAdmin.js";
import { createOpeningPettyCash } from "./src/modules/pettyCash/pettyCashService.js";

const PORT = process.env.PORT 

const startServer = async () => {
    try {
        await connectDB();

        await seedSuperAdmin();

        await createOpeningPettyCash(0);

        console.log("Petty cash initialized successfully");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();
