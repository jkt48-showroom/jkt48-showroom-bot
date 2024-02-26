const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({
      message: "Unauthorized"
    }); // Unauthorized
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Forbidden or token expired"
      }); // Forbidden
    }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
