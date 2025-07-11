import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config"
import userRouter from "./routes/user.js";
import productRouter from "./routes/product.js";
import cartRouter from "./routes/cart.js";
import orderRouter from "./routes/order.js";
import summaryRouter from "./routes/admin.js";


// Connect to database
await mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Database connected successfully"))
    .catch((error) => console.log("Error connecting to database", error));


// create express app
const app = express();


// Use Middlewares
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({
    extended: true }))



// use routes
app.use( userRouter)
app.use(productRouter)
app.use( cartRouter)
app.use(orderRouter)
app.use(summaryRouter)




// Listen for incoming requests
app.listen(5000, () => {
    console.log("App is listening on port 5000")
});