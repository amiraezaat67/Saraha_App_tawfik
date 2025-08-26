import { users, blackListTokens } from "../../../DB/Models/index.js";
import { generateToken, verifyToken, encrypt, emitter } from "../../../Utils/index.js";
import bycrpt from "bcrypt";
import { customAlphabet } from "nanoid";
import { v4 as uuidV4 } from "uuid";

export const registerServices = async (req, res) => {
  // get data from body
  const { firstName, lastName, email, password, phoneNumber, gender } = req.body;

  // find the email
  const findUser = await users.findOne({ email });
  if (findUser) {
    return res.status(400).json({ msg: `User Already exist` });
  }

  // encryp phneNumber
  const encryptedPhoneNumber = encrypt(phoneNumber);

  // hash password
  const hashedPassword = await bycrpt.hash(password, parseInt(process.env.SALT_ROUNDS));

  // send email
  // create OTP
  const nanoid = customAlphabet("1234567890", 6);
  const OTP = nanoid();
  emitter.emit("sendEmail", {
    to: email,
    subject: `Email Confirmation`,
    content: `<h1>
      Your Confirmation otp is
      <h2>${OTP}</h2>
      </h1>;`,
  });

  // hash the OTP before sending to db
  const hashedOTP = await bycrpt.hash(OTP, parseInt(process.env.SALT_ROUNDS));

  // add the user to DB
  users.create({ firstName, lastName, email, password: hashedPassword, phoneNumber: encryptedPhoneNumber, gender, otps: { confirm: hashedOTP } });

  res.status(201).json({ msg: `Registered successfully, now please confirm your email` });
};

export const confirmService = async (req, res) => {
  // get the otp and the email from the user
  const { otp, email } = req.body;

  // check if this email does not exist
  const user = await users.findOne({ email });
  if (!user) {
    return res.status(404).json({ msg: `this email does not exist` });
  }

  // check if the user already confirmed before
  if (user.isConfirmed) {
    return res.status(409).json({ msg: `your email is already confirmed` });
  }

  // get the Right otp from db
  const correctOtp = user.otps?.confirm;

  // compaite the OTPs together
  const otpIsMatched = await bycrpt.compare(otp.toString(), correctOtp);
  if (!otpIsMatched) {
    return res.status(400).json({ msg: `worng OTP, please try again` });
  }

  // if it is correct , delete the otp from db
  await user.updateOne({ isConfirmed: true, otps: { confirm: undefined } });

  res.status(200).json({ msg: `email has been confirmed` });
};

export const loginService = async (req, res) => {
  // get the email and passowrd
  const { email, password } = req.body;

  // check the email and password
  const user = await users.findOne({ email });
  if (user) {
    const checkPassword = await bycrpt.compare(password.toString(), user.password);
    if (!checkPassword) {
      // wrong password
      return res.status(400).json({ msg: `invalid email or password` });
    }
  } else {
    // invalid email
    return res.status(400).json({ msg: `invalid email or password` });
  }

  // check if the email in confirmed
  if (!user.isConfirmed) {
    return res.status(400).json({ msg: `This email is not verified yet` });
  }

  // generate token
  const accessTokenId = uuidV4();
  // access token
  const accessToken = generateToken(
    {
      _id: user._id,
      email,
    },
    process.env.JWT_ACCESS_KEY,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      jwtid: accessTokenId,
    }
  );

  // refresh token
  const refreshToken = generateToken(
    {
      _id: user._id,
      email,
    },
    process.env.JWT_REFRESH_KEY,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      jwtid: uuidV4(),
    }
  );

  res.status(200).json({ msg: `User loggin successfully`, accessToken, refreshToken });
};

export const logoutService = async (req, res) => {
  // get the token
  const { tokenData } = req.loggedData;

  // Revoke the token
  blackListTokens.create({
    tokenId: tokenData.jti,
    expirationDate: new Date(tokenData.exp * 1000),
  });

  res.status(200).json({ msg: `logged out successfully` });
};

export const forgetPasswordService = async (req, res) => {
  // get the email of the user
  const { email } = req.body;

  //check for the email in db
  const user = await users.findOne({ email });
  if (!user) {
    return res.status(400).json({ msg: `no user with this data` });
  }

  // create recovery token
  const recoveryToken = generateToken(
    {
      _id: user._id,
      email,
    },
    process.env.JWT_RECOVERY_KEY,
    {
      expiresIn: process.env.JWT_RECOVERY_EXPIRES_IN,
      jwtid: uuidV4(),
    }
  );

  // create OTP
  const nanoid = customAlphabet("1234567890ABCDEFG", 6);
  const recoveryOTP = nanoid();

  // send email with the otp
  emitter.emit("sendEmail", {
    to: email,
    subject: `password recover`,
    content: `<h1>
      Your otp to recover the password is
      <h2>${recoveryOTP}</h2>
      </h1>;`,
  });

  // hash the OTP before sending to db
  const hashedRecoveryOTP = await bycrpt.hash(recoveryOTP, parseInt(process.env.SALT_ROUNDS));

  // store the otp in db
  await user.updateOne({ otps: { recovery: hashedRecoveryOTP } });

  res.status(200).json({ msg: `please check your email`, recoveryToken });
};

export const resetPasswordService = async (req, res) => {
  // get otp , new password and the user
  const { otp, newPassword } = req.body;
  const { user } = req.loggedData;

  // get the Right otp from db
  const correctOtp = user.otps?.recovery;

  if (!correctOtp) {
    return res.status(400).json({ msg: `Wrong email` });
  }

  // compaire the OTPs together
  const otpIsMatched = await bycrpt.compare(otp.toString(), correctOtp);
  if (!otpIsMatched) {
    return res.status(400).json({ msg: `worng OTP, please try again` });
  }

  // if it is correct , hash the new password
  const hashedPassword = await bycrpt.hash(newPassword, parseInt(process.env.SALT_ROUNDS));

  // update the password
  await user.updateOne({ password: hashedPassword, otps: { recovery: undefined } });

  res.status(200).json({ msg: `Password has been changed, Now try to login` });
};

export const refreshTokenServices = async (req, res) => {
  // get the refreshed token
  const { refreshtoken } = req.headers;

  // verfiy the token
  const decodedData = verifyToken(refreshtoken, process.env.JWT_REFRESH_KEY);

  // generate new access token
  const accessToken = generateToken(
    {
      _id: decodedData._id,
      email: decodedData.email,
    },
    process.env.JWT_ACCESS_KEY,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      jwtid: uuidV4(),
    }
  );

  res.status(200).json({ msg: `token has been refreshed`, accessToken });
};

export const updatePasswordServices = async (req, res) => {
  // get user data and the token
  const { user, tokenData } = req.loggedData;

  // get the current and new password
  const { currentPassword, newPassword } = req.body;

  // check if the old password is correct
  const correctPasswordCheck = await bycrpt.compare(currentPassword, user.password);
  if (!correctPasswordCheck) {
    return res.status(400).json({ msg: `wrong password` });
  }

  // change the password
  user.password = bycrpt.hashSync(newPassword, parseInt(process.env.SALT_ROUNDS));

  // send an email to inform the user about
  emitter.emit("sendEmail", {
    to: user.email,
    subject: `password Changed`,
    content: `<h1>
      Your password has been Changed
      <h2>this action happend at ${new Date().toLocaleString()}</h2>
      <h3>if this is not you, please restart your password</h3>
      </h1>;`,
  });

  // save the new password in the DB
  user.save();

  // Revoke the token
  blackListTokens.create({
    tokenId: tokenData.jti,
    expirationDate: new Date(tokenData.exp * 1000),
  });

  res.status(200).json({ msg: `password has been updated. Now please log in again` });
};
