//const mongoose = require('mongoose')
import mongoose from "mongoose";
const uri_local = "mongodb://localhost:27017";
const uri_brayan =
  "mongodb+srv://bearevalo:V9FhzTlm0ylumTbo@cluster0.yobuluw.mongodb.net/vidaplena?retryWrites=true&w=majority";
//const uri =("mongodb+srv://marioquintero:IpsMed1gr0up1115a@medigroup-cluster.2svt4dr.mongodb.net/vidaplena?retryWrites=true&w=majority");

export const connectDB = async () => {
  try {
    //await mongoose.connect(uri_local + "/vidaplena_local");
    await mongoose.connect(uri_brayan);
    // await mongoose.connect(uri)
    console.log(">>> DB is connected");
  } catch (error) {
    console.error(error);
  }
};
