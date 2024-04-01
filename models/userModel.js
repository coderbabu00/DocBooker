import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name Is Required!"],
    minLength: [3, "First Name Must Contain At Least 3 Characters!"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name Is Required!"],
    minLength: [3, "Last Name Must Contain At Least 3 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Email Is Required!"]
  },
  phone: {
    type: String,
    required: [true, "Phone Is Required!"],
    minLength: [10, "Phone Number Must Contain Exact 10 Digits!"],
  },
  dob: {
    type: Date,
    required: [true, "DOB Is Required!"],
  },
  gender: {
    type: String,
    required: [true, "Gender Is Required!"],
    enum: ["Male", "Female"],
  },
  password: {
    type: String,
    required: [true, "Password Is Required!"],
    minLength: [8, "Password Must Contain At Least 8 Characters!"],
    select: false,
  },
  doctorDepartment:{
    type: String
  },
  role: {
    type: String,
    required: [true, "User Role Required!"],
    enum: ["Patient", "Doctor", "Admin"],
    default: "Patient"
  },
  // docAvatar: {
  //   public_id: String,
  //   url: String,
  // },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String, // Add resetPasswordToken field
  resetPasswordExpires: Date // Add resetPasswordExpires field
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id}, process.env.JWT_SECRET,{
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Reset Password Token
userSchema.methods.getResetPasswordToken = async function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");
    
    // Set resetPasswordToken and resetPasswordExpires in the user document
    this.resetPasswordToken = resetToken;
    this.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    
    // Save the user document
    await this.save();
    
    return resetToken;
}

export const User = mongoose.model("User", userSchema);
export default User