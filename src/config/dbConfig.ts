import dotenv from "dotenv";

dotenv.config();

const config = {
    appName: process.env.APP_NAME,
    port: process.env.PORT,
    mongoURI: process.env.MONGO_URI,
    dbName: process.env.DB_NAME,
};

export default config;