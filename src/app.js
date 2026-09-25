import "dotenv/config";
import express from "express"
import cors from "cors"
import cookieparser from "cookieparser"

const app = express()

app.use(cors({
    origin: process.env.CROS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))

app.use(express.static("public"))
app.use(cookieparser())

import userRouter from `./routes/user.route.js`

app.use("/api/v1/users",userRouter)

//http://localhost:18000/api/v1/users/register

export {app}