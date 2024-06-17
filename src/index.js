// index.js
//const express = require("express");
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import morgan from "morgan";
import cors from "cors";
import verifyToken from "./api/middlewares/tokenVerifierMiddleware.js";
import indexRoutes from "./api/routes/index.routes.js";
import { connectDB } from "./database.js";


//const http = require("http");
//const morgan = require("morgan");
//const cors = require("cors");
//const app = express();
//require("dotenv").config();
//const vidaPlenaRoutes = require("./api/routes/vidaPlenaRoutes");
//const verifyToken = require("./api/middlewares/tokenVerifierMiddleware");
//const router_user = require("./api/routes/user.routes");
//const router_alimento = require("./api/");
//require("./database");

const PORT = process.env.PORT || 3001;
//const server = http.createServer(app);
const app = express();

connectDB();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

// Aplicar verifyToken a todas las rutas dentro de vidaPlenaRoutes
//app.use("/vidaplena", verifyToken, vidaPlenaRoutes);

//app.use("/vidaplena", router);
// app.use("/vidaplena", verifyToken, router);
app.use("/vidaplena", verifyToken, indexRoutes);
app.listen(PORT);
// server.listen(PORT, () => {
//   console.log("App Running on Port: " + PORT);
// });
