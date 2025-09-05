import jwt from "jsonwebtoken";

// generate token
export const generateToken = (payload, key, options) => {
  return jwt.sign(payload, key, options);
};

// verify token
export const verifyToken = (token, key) => {
  return jwt.verify(token, key);
};

// decode token "to only get the payload wihtout verfing"
// This way not safe because verify apply some validation before decode it
export const decodeToken = (token) => {
  return jwt.decode(token);
};
