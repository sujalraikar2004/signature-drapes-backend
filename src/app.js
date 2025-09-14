import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app=express()
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

app.use("/api/v1/products", productRouter)
app.use("/api/v1/user",UserRoutes)
app.use("/api/v1/cart", CartRoutes)
app.use("/api/v1/orders",OrderRoutes)

export default app
