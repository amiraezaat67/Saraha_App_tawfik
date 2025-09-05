import bycrpt from "bcrypt";
import { customAlphabet, nanoid } from "nanoid";
import { v4 as uuidV4 } from "uuid";
import { OAuth2Client } from "google-auth-library";

import { users, blackListTokens } from "../../../DB/Models/index.js";
import { generateToken, verifyToken, encrypt, emitter, decodeToken } from "../../../Utils/index.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @API {POST} /api/auth/register Register
 * @description Register a new user with hashed password and encrypted phone number
 */
export const registerServices = async (req, res) => {
  // get data from body
  const { firstName, lastName, email, password, phoneNumber, gender } = req.body;

  // find the email
  const findUser = await users.findOne({ email });
  if (findUser) {
    if (findUser.providers == "google") {
      return res.status(400).json({ msg: `User Already exist, Try to login using google` });
    }
    if (findUser.isConfirmed == false) {
      // we shouldn't delete the user if he is not confirmed without any notification for him at least
      await users.findByIdAndDelete(findUser._id);
    }
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
  const user = await users.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phoneNumber: encryptedPhoneNumber,
    gender,
    otps: { confirm: hashedOTP, expiration: new Date(Date.now() + parseInt(process.env.RESEND_OTP_TIME) * 60 * 1000), attemptNumber: 1 },
    providers: "local",//Use the generated enum providerEnum.LOCAL
  });

  // create auth token
  // What this token refering to ?
  const authenticationToken = generateToken(
    {
      _id: user._id,
      email,
    },
    process.env.JWT_AUTH_KEY,
    {
      expiresIn: process.env.JWT_AUTH_EXPIRES_IN,
      jwtid: uuidV4(),
    }
  );

  res.status(201).json({ msg: `Registered successfully, now please confirm your email`, authenticationToken });
};

export const gmailAuthService = async (req, res) => {
  // get the idToken from the req body
  const { idToken } = req.body;

  // verfiy the token using google-auth-library
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: process.env.WEB_CLIENT_ID,
  });
  const { sub, email, email_verified, given_name, family_name } = ticket.getPayload();

  // check if this email is not verified from google
  if (!email_verified) {
    return res.status(400).json({ msg: `this email is not verified` });
  }

  const findUser = await users.findOne({ googleSub: sub });
  let user;

  // if user already logged in using goole, update his data
  if (findUser) {
    user = findUser;
    user.email = email;
    user.firstName = given_name;
    user.lastName = family_name ? family_name : user.lastName;
    user.providers = "google"; //Use the generated enum providerEnum.GOOGLE
    await user.save();
  }

  // if user is not logged in using google:
  else {
    // check if this user is not logged in using local signup
    const localUser = await users.findOne({ email, providers: "local" }); //Use the generated enum providerEnum.LOCAL
    if (localUser) {
      user = localUser;
      user.email = email;
      user.firstName = given_name;
      user.lastName = family_name ? family_name : user.lastName;
      user.isConfirmed = true;
      user.googleSub = sub;
      user.otps.confirm = undefined;
      user.providers = "google"; //Use the generated enum providerEnum.GOOGLE
      await user.save();
    } else {
      // create new user
      user = await users.create({
        firstName: given_name,
        lastName: family_name || " ",
        email,
        password: bycrpt.hashSync(nanoid(), parseInt(process.env.SALT_ROUNDS)),
        isConfirmed: true,
        googleSub: sub,
        providers: "google",
      });
    }
  }

  // check for the number of logged in devices
  if (user.devicesConnected?.length >= process.env.MAX_DEVICE_CONNECTED) {
    return res.status(400).json({ msg: `You need to signOut from one of your connected devices to login` });
  }

  // generate tokens
  const accessTokenId = uuidV4();
  const refreshTokenId = uuidV4();
  // access token
  const accessToken = generateToken(
    {
      _id: user._id,
      email,
      refreshTokenId,
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
      jwtid: refreshTokenId,
    }
  );

  // insert the connected device data

  /**
   * @comment :  why we need to decode the token - all the required data already with us 
      * jti => refreshTokenId 
      * exp => process.env.JWT_REFRESH_EXPIRES_IN
      * user.devicesConnected?.push({ jti:refreshTokenId, exp: new Date(process.env.JWT_REFRESH_EXPIRES_IN * 1000) });
      * 
   */
  
  const { jti, exp } = decodeToken(refreshToken);

  user.devicesConnected?.push({ jti, exp: new Date(exp * 1000) });
  await user.save();

  res.status(200).json({ msg: `User loggin successfully`, accessToken, refreshToken });
};

export const confirmService = async (req, res) => {
  // get the otp from the user and user from token
  const { otp } = req.body;
  const { user } = req.loggedData;

  // check if the user already confirmed before
  if (user.isConfirmed) {
    return res.status(409).json({ msg: `your email is already confirmed` });
  }

  // get the Right otp from db
  const correctOtp = user.otps?.confirm;

  // compaite the OTPs together
  const otpIsMatched = await bycrpt.compare(otp.toString(), correctOtp);
  if (!otpIsMatched) {
    const remainingTime = (user.otps.expiration - new Date()) / 1000;
    const remainingTimeMessage = remainingTime < 0 ? `Now` : `after ${remainingTime} sec`;

    return res.status(400).json({ msg: `worng OTP, please try again , you can resend email ${remainingTimeMessage}` });
  }

  // if it is correct , delete the otp from db
  await user.updateOne({ isConfirmed: true, otps: {} });

  res.status(200).json({ msg: `email has been confirmed, Now please sing in` });
};

export const loginService = async (req, res) => {
  // get the email and passowrd
  const { email, password } = req.body;

  // get the user data
  const user = await users.findOne({ email });

  // check if the user registerd locally or not
  if (user?.providers == "google") {
    return res.status(400).json({ msg: `Try login with google` });
  }

  // check for email and password
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

  // check for the number of logged in devices
  if (user.devicesConnected?.length >= process.env.MAX_DEVICE_CONNECTED) {
    return res.status(400).json({ msg: `You need to signOut from one of your connected devices to login` });
  }

  // generate token
  const accessTokenId = uuidV4();
  const refreshTokenId = uuidV4();
  // access token
  const accessToken = generateToken(
    {
      _id: user._id,
      email,
      refreshTokenId,
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
      jwtid: refreshTokenId,
    }
  );

  // insert the connected device data
  const { jti, exp } = decodeToken(refreshToken);

  user.devicesConnected?.push({ jti, exp: new Date(exp * 1000) });
  await user.save();

  res.status(200).json({ msg: `User logged In successfully`, accessToken, refreshToken });
};

/**
 * @comment : we need to revoke accessToken and refreshToken
 */
export const logoutService = async (req, res) => {
  // get the token
  const { user, tokenData } = req.loggedData;

  // Revoke the token
  blackListTokens.create({
    tokenId: tokenData.jti,
    expirationDate: new Date(tokenData.exp * 1000),
  });

  // decrimint the conected devices
  for (const [index, device] of user.devicesConnected.entries()) {
    if (device.jti == tokenData.refreshTokenId) {
      user.devicesConnected.splice(index, 1);
      if (user.devicesConnected.length == 0) user.devicesConnected = undefined;
      await user.save();
      break;
    }
  }

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
    process.env.JWT_AUTH_KEY,
    {
      expiresIn: process.env.JWT_AUTH_EXPIRES_IN,
      jwtid: uuidV4(),
    }
  );

  // create OTP
  const nanoid = customAlphabet("1234567890", 6);
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

  // store the otp in db and the time for expiration
  await user.updateOne({ otps: { recovery: hashedRecoveryOTP, expiration: new Date(Date.now() + parseInt(process.env.RESEND_OTP_TIME) * 60 * 1000) } });

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
    const remainingTime = (user.otps.expiration - new Date()) / 1000;
    const remainingTimeMessage = remainingTime < 0 ? `Now` : `after ${remainingTime} sec`;

    return res.status(400).json({ msg: `worng OTP, please try again , you can resend email ${remainingTimeMessage}` });
  }

  // if it is correct , hash the new password
  const hashedPassword = await bycrpt.hash(newPassword, parseInt(process.env.SALT_ROUNDS));

  // update the password and desconnect all the devices
  await user.updateOne({ password: hashedPassword, otps: {}, $unset: { devicesConnected: "" } });

  res.status(200).json({ msg: `Password has been changed, Now try to login` });
};

/**
 * @comment : It's better to create a new middlware for verifying the refreshtoken because we need to verify the refresh token also on the logout
 */
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
      refreshTokenId: decodeToken(refreshtoken).jti,
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

  /**
   * @comment : we need to revoke the REFRESH token also
   */
  // Revoke the token
  blackListTokens.create({
    tokenId: tokenData.jti,
    expirationDate: new Date(tokenData.exp * 1000),
  });

  res.status(200).json({ msg: `password has been updated. Now please log in again` });
};


/**
 * @comment : How the user is already logged in and on the same time he asks for sending otp for confirmation or recovery ??
 */
export const resendEmailService = async (req, res) => {
  // get user data from token
  const { user } = req.loggedData;

  // check the user attempts
  if (user.otps?.attemptNumber > 3) {
    if (Date.now() - user.otps.lastEmailAttempt > 1000 * 60 * 5) {
      user.otps.attemptNumber = 0;
      await user.save();
    }
    return res.status(400).json({ msg: `too many attempts , try again after 5 mins` });
  }

  //create new otp
  const nanoid = customAlphabet("1234567890", 6);
  const newOTP = nanoid();

  const hashedNewOTP = await bycrpt.hash(newOTP, parseInt(process.env.SALT_ROUNDS));

  // check if the this is recovery or registration
  let emailContent;
  if (user.otps?.confirm) {
    user.otps.confirm = hashedNewOTP;
    emailContent = {
      to: user.email,
      subject: `Email Confirmation`,
      content: `<h1>
      Your Confirmation otp is
      <h2>${newOTP}</h2>
      </h1>;`,
    };
  } else if (user.otps?.recovery) {
    user.otps.recovery = hashedNewOTP;
    emailContent = {
      to: user.email,
      subject: `password recover`,
      content: `<h1>
      Your otp to recover the password is
      <h2>${newOTP}</h2>
      </h1>;`,
    };
  }

  // send new email
  emitter.emit("sendEmail", emailContent);

  // update the attempts
  const newAttempt = user.otps.attemptNumber + 1;

  // send the new data to the DB
  user.otps.attemptNumber = newAttempt;
  user.otps.lastEmailAttempt = Date.now();
  await user.save();

  res.status(200).json({ msg: `email has been send again` });
};
