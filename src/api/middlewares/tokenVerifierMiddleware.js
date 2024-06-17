import dotenv from "dotenv";
dotenv.config();
const secretToken = process.env.SECRET_TOKEN;

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    if (bearerToken === secretToken) {
      next();
    } else {
      res.sendStatus(403); // Forbidden
    }
  } else {
    res.sendStatus(403);
  }
};

export default verifyToken;
