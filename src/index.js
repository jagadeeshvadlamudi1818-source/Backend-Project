//require('dotenv').config({path: './env'})
// import mongoose from "mongoose";
// import {DB_NAME} from "./constants";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config();

connectDB();
/*

import express from "express"

const express = express()

(async () => {
    try {
      await  mongoose.connect(`${process.env.
          MONGODB_URI}/${DB_NAME}`)
          app.on("error", (error) => {
            console.log("ERROR: ",error);
            throw error
          })

          app.listen(process.env.PORT, () => {
            console.log(`App is listing on port $ 
                {process.env.PORT}`);
          })

    } catch (error) {
        console.error("ERROR",error)
        throw err
    }
})()
    */
