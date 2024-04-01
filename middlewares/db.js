import mongoose from "mongoose";
import { errorHandler } from "../utils/error.js";
const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.DB_URL);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }catch(error){
        console.log(error);
        next(errorHandler(error.message, 500));
        process.exit(1);
    }
}

export default connectDB