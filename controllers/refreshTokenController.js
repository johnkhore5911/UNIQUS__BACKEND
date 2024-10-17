const { User } = require("../models/User");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  console.log("Inside Hanlde refresh token!");
  // get the refresh token from the cookies
  const cookies = req.cookies;
  console.log("Cookies i got: ",cookies);
  if (!cookies?.jwt)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  console.log("refreshToken: ",refreshToken);

  // find the user in the DB based on refresh token
  const foundUser = await User.findOne({ refreshToken }).exec();

  if(!foundUser){
    console.log("Nhi mila");
  }
  if (!foundUser)
    return res
      .status(403)
      .json({ success: false, message: "No user with provided id" });

  // verify refresh token
  jwt.verify(refreshToken, "johnkhore", (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Unable to decode refresh token" });
    }

    const userid = decoded.userId;
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: "No userid in the decoded refresh token",
      });
    }

    if (foundUser.id !== userid)
      return res
        .status(403)
        .json({ success: false, message: "Invalid Refresh token or user id" });

    const userID = foundUser.id;

    const token = jwt.sign({ userId: userID }, "johnkhore", {
      expiresIn: '30s',
    });

    res.status(200).json({ success: true, message: "token refreshed", token });
  });
};

module.exports = { handleRefreshToken };
