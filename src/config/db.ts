import mongoose from "mongoose";
import config from "./dbConfig";

const { mongoURI, dbName } = config;

let db: mongoose.Connection;

const connectDB = async () => {
    try {
        if (!mongoURI || !dbName) {
            throw new Error("mongoURI and dbName must be defined");
        }

        if (!db) {
            await mongoose.connect(mongoURI, {
                dbName,
            });
            db = mongoose.connection;
        }
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db;
};

export { connectDB, getDB };