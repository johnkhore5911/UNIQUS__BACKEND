require("dotenv").config({ path: "../config.env" });
const jwt = require("jsonwebtoken");
const errorResponse = require("../utils/errorResponse");
const { User } = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new errorResponse("Not authorized", 401));
  }

  try {
    const decoded = jwt.verify(token, "johnkhore");
    if (!decoded) throw new Error("Unable to decode the access token");

    const userId = decoded?.userId;
    if (!userId) throw new Error("No userid in the decoded token");

    const user = await User.findById(userId);

    if (!user) {
      return next(new errorResponse("No user found with this id", 404));
    }

    const userID = user.id;
    const userRole = user.userRole;
    req.user = { userID, userRole };

    next();
  } catch (err) {
    console.log({ protectError: err });
    return res.sendStatus(403);
  }
};

module.exports = protect;
