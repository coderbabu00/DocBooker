import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import cloudinary from "cloudinary";
import sendToken from '../utils/jwtToken.js';
import sendMail from "../utils/sendMail.js";
import doctorToken from '../utils/DoctorToken.js';

export const patientRegister = async (req, res, next) => {
    try{
        const { firstName, lastName, email, phone, dob, gender, password }= req.body;
        if (
            !firstName ||
            !lastName ||
            !email ||
            !phone ||
            !dob ||
            !gender ||
            !password
          ){
            return next(errorHandler("All Fields Are Required", 400));
          }
          const isRegistered = await User.findOne({ email });
          if(isRegistered){
            return next(errorHandler("User Already Registered", 409));
          }
          const user = await User.create({
            firstName,
            lastName,
            email,
            phone,
            dob,
            gender,
            password,
            role: "Patient",
          });

          const userI = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            dob: user.dob,
            gender: user.gender,
            role: user.role,
          }
          const activationToken = createActivationToken(userI);
          const activationUrl = `http://localhost:9300/activation/${activationToken}`;
          
          await sendMail({
            email: userI.email,
            subject: "Activate your account",
            message: `Hello ${userI.firstName}, please click on the link to activate your account: ${activationUrl}`,
          });
          res.status(201).json({
            success: true,
            message: `Please check your email:- ${userI.email} to activate your account!`,
          });
    }catch(error){
        console.log(error)
        next(error)
    }
}

// Doctor Register
export const doctorRegister = async (req, res, next) => {
  try{
    const { firstName, lastName, email, phone, dob, gender, password, doctorDepartment }= req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !dob ||
      !gender ||
      !password ||
      !doctorDepartment
    ){
      return next(errorHandler("All Fields Are Required", 400));
    }
    const isRegistered = await User.findOne({ email });
    if(isRegistered){
      return next(errorHandler("User Already Registered", 409));
    }
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      password,
      role: "Doctor",
      doctorDepartment
    });
    const userI = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      gender: user.gender,
      role: user.role,
    }
    const activationToken = createActivationToken(userI);
    const activationUrl = `http://localhost:9300/activation/${activationToken}`;
    await sendMail({
      email: userI.email,
      subject: "Activate your account",
      message: `Hello ${userI.firstName}, please click on the link to activate your account: ${activationUrl}`,
    })
    res.status(201).json({
      success: true,
      message: `Please check your email:- ${userI.email} to activate your account!`,
    })
  }catch(error){
    console.log(error)
    next(error)
  }
}
// Resend Activation Token
export const resendActivationToken = async (req, res, next) => {
  try{
   const {email} = req.body;
   const user = await User.findOne({email});
   if(!user){
     return next(errorHandler("User Not Found", 404));
   }
   const activationToken = createActivationToken(user);
   const activationUrl = `http://localhost:9300/activation/${activationToken}`;
   await sendMail({
     email: user.email,
     subject: "Activate your account",
     message: `Hello ${user.firstName}, please click on the link to activate your account: ${activationUrl}`,
   })
  }catch(error){
    console.log(error)
    next(error)
  }
}

// Create Activation Token
const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
      expiresIn: "5m",
    });
  };

  // Verify email
  export const verifyEmail = async (req, res, next) => {
      try{
      const {activationToken} = req.body;
      const user = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
      // Both are right
    //   const {email} = user
      const email = user.email;
      const updated = await User.findOneAndUpdate({email}, {isVerified: true});
      await updated.save();
      await sendMail({
        email: updated.email,
        subject: "Activate your account",
        message: `Hello ${updated.firstName}, your account has been activated`,
      });
    res.status(200).json({
      success: true,
      message: "Your account has been activated.",
    });
      }catch(error){
        console.log(error)
        next(error)
      }
  }

// Get all doctors
  export const getAllDoctors = async (req, res, next) => {
    const doctors = await User.find({ role: "Doctor" });
    res.status(200).json({
      success: true,
      doctors,
    });
  };

  // Get User Details
  export const getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(errorHandler("User Not Found", 404));
    }
    res.status(200).json({
      success: true,
      user,
    });
  }

  // Patient Logout
  export const patientLogout = async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(errorHandler("User Not Found", 404));
    }
    user.token = null;
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      })
      .json({
        success: true,
        message: "Logged Out",
      });
  }

  // Doctor Logout
  export const doctorLogout = async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(errorHandler("User Not Found", 404));
    }
    user.token = null;
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      })
      .json({
        success: true,
        message: "Logged Out",
      });
  }

  // Patient Login
  export const patientLogin = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(errorHandler("Invalid Email or Password", 401));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(errorHandler("Invalid Email or Password", 401));
    }
    sendToken(user, 200, res);
  }

  // Doctor Login
  export const doctorLogin = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(errorHandler("Invalid Email or Password", 401));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(errorHandler("Invalid Email or Password", 401));
    }
    sendToken(user, 200, res);
  }

  // Forget Password
  export const forgetPassword = async (req, res, next) => {
    try{
     const {email} = req.body;
     const user = await User.findOne({email});
     if(!user){
         return next(errorHandler("User Not Found", 404));
     }
     const resetToken = user.getResetPasswordToken();
     await user.save();
     await sendMail({
         email: user.email,
         subject: "Reset Password",
         message: `http://localhost:3000/password/reset/${resetToken}&id=${user._id}`,
     })
    }catch(error){
        console.log(error)
        next(error)
    }
  }

  // Reset Password
  export const resetPassword = async (req, res, next) => {
    try{
     const {resetToken, id} = req.query;
     if(!resetToken || !id){
         return next(errorHandler("Invalid Token", 404));
     }
     const user = await User.findById(id);
     if(!user){
         return next(errorHandler("User Not Found", 404));
     }
      // Validate token
      if (token !== user.resetPasswordToken) {
        return next(errorHandler(400, "Invalid token"));
    }
     // Check if the reset token has expired
     if (user.resetPasswordExpires < Date.now()) {
      return next(errorHandler(400, "Reset token has expired"));
  }

  user.password = req.body.password;
  // Clear the reset password token and expiration
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // Save the updated user document
  await user.save();
  await sendMail({
    email: user.email,
    subject: `Password Changed Successfully`,
    message: `Your password has been updated successfully`,
  })
  res.status(200).json({
    success: true,
    message: "Password updated successfully"
});
    }catch(error){
        console.log(error)
        next(error)
    }
  }