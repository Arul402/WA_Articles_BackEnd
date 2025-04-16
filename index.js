import express from 'express'
const app = express()
import dotenv from 'dotenv'
dotenv.config()
const PORT=process.env.PORT
import connectDb from './db/connectionDB.js'
import KatturaiRoute from './routes/Articles.js'
import AdminRoute from './routes/Admin.js'
import SearchRoute from './routes/searchRoutes.js'
import morgan from 'morgan'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import corsOptions from './config/corsOptions.js'
// import multer from 'multer'
const __dirname=path.dirname(fileURLToPath(import.meta.url))

app.use(cors(corsOptions))
app.use(express.json())
app.use(morgan("short"))
app.use(express.urlencoded({extended:false}))
// app.use(express.static(__dirname+"/public/images"))
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/api/katturai/',KatturaiRoute)
app.use('/api/admin/',AdminRoute)
app.use('/api/search/',SearchRoute)


app.listen(PORT,()=>{
    console.log(`✅ Server Running On Port : ${PORT}`);
    connectDb();
})