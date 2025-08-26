import { verifyToken } from "../Utils/index.js";
import { blackListTokens } from "../DB/Models/index.js";
import { users } from "../DB/Models/index.js";

export const authenticationMiddleware = async (req, res, next) => {
  // get the token from the header
  const { accesstoken, recoverytoken } = req.headers;

  // check if the token is not send
  if (!accesstoken && !recoverytoken) {
    return res.status(400).json({ msg: `insert A token` });
  }

  // verify the token
  let tokenData;
  if (accesstoken) {
    tokenData = verifyToken(accesstoken, process.env.JWT_ACCESS_KEY);
    if (!tokenData.jti) {
      return res.status(400).json({ msg: `invalid token` });
    }
  } else if (recoverytoken) {
    tokenData = verifyToken(recoverytoken, process.env.JWT_RECOVERY_KEY);
    if (!tokenData.jti) {
      return res.status(400).json({ msg: `invalid token` });
    }
  }

  // check if the token is not revoked
  const revokedToken = await blackListTokens.findOne({ tokenId: tokenData.jti });
  if (revokedToken) {
    return res.status(400).json({ msg: `token is revoked` });
  }

  // get the user from DB
  const user = await users.findById(tokenData._id);

  if (!user) {
    return res.status(400).json({ msg: `user not found` });
  }

  req.loggedData = { user, tokenData };

  next();
};
