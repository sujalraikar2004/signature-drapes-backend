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

app.use("/api/v1/products", productRouter)
app.use("/api/v1/user",UserRoutes)

export default app
