import express from "express";
import { doctorLogin, doctorLogout, doctorRegister, forgetPassword, getAllDoctors, getUserDetails, patientLogin, patientLogout, patientRegister, resendActivationToken, resetPassword, verifyEmail } from "../controllers/userController.js";
import {isAuthenticated, isDoctor} from "../middlewares/auth.js";
const router = express.Router();

router.post("/register",patientRegister);
router.post("/patient/register", patientRegister);
router.post("/doctor/register", doctorRegister);
router.post("/resend-Token", resendActivationToken);
router.post("/verify", verifyEmail);
router.get("/get-all-doctors",isAuthenticated, getAllDoctors);
router.get("/get-user-details/:id",isAuthenticated,isDoctor, getUserDetails);
router.post("/patient/logout", isAuthenticated, patientLogout);
router.post("/doctor/logout", isDoctor, doctorLogout);
router.post("/patient/login", patientLogin);
router.post("/doctor/login", doctorLogin);
router.post("/forget-password",forgetPassword);
router.post("/reset-password",resetPassword);

export default router