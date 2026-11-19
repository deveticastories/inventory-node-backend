
import "dotenv/config";
import mongoose from "mongoose";
import {
    createOpeningPettyCash,
} from "../modules/pettyCash/pettyCashService.js";

const initializePettyCash = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("MONGO_URI is missing in .env");
        }

        await mongoose.connect(mongoUri, {
            dbName: process.env.DB_NAME,
        });

        console.log("Connected database:", mongoose.connection.name);

        const openingBalance = 0;

        const pettyCash = await createOpeningPettyCash(openingBalance);

        console.log("Petty Cash initialized successfully:", pettyCash);
    } catch (error) {
        console.error("Petty Cash initialization failed:", error);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};

initializePettyCash();
