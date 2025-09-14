import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app=express()
app.use(cors({
    credentials:true,
    origin:process.env.CORS_ORIGIN,

}))

app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

//routes
import productRouter from './routes/product.route.js'
import UserRoutes from  './routes/user.routes.js'
import CartRoutes from './routes/cart.route.js'
import OrderRoutes from './routes/order.route.js'
import ReviewRoutes from './routes/review.route.js'
import LikeRoutes from './routes/like.route.js'

app.use("/api/v1/products", productRouter)
app.use("/api/v1/user",UserRoutes)
app.use("/api/v1/cart", CartRoutes)
app.use("/api/v1/orders",OrderRoutes)
app.use("/api/v1/products", ReviewRoutes)
app.use("/api/v1/products", LikeRoutes)

export default app
