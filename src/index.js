import dotenv from "dotenv";
import connectDB from "./db/db.js";
import app from './app.js'
import { connectRedis } from "./db/redis.js";

dotenv.config({
    path: './.env'
})

Promise.all([connectDB(), connectRedis()])
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(` Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("DB connection failed !!! ", err);
})