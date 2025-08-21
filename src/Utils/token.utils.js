import jwt from "jsonwebtoken";

// generate token
export const generateToken = (payload, key, options) => {
  return jwt.sign(payload, key, options);
};

// verify token
export const verifyToken = (token, key) => {
  return jwt.verify(token, key);
};
