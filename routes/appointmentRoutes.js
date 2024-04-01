import express from "express";
import { appointmentSuccess, approveAppointment, bookAppointment, deleteAppointment, myAppointments, pendingAppointments } from "../controllers/appointmentController.js";
import {isAuthenticated, isDoctor, isPatient} from "../middlewares/auth.js";
const router = express.Router();

router.post("/book-appointment", isAuthenticated, bookAppointment);
// router.post("/getall",isDoctor,isPatient,myAppointments);
// router.put("/update/:id", isDoctor, changeAppointmentStatus);
router.delete("/delete/:id", isAuthenticated,isPatient, deleteAppointment);
router.put("/approve/:id",approveAppointment)
router.delete("/cancel/:id",isAuthenticated,isPatient, deleteAppointment);
router.put("/success/:id",isAuthenticated,isDoctor, appointmentSuccess);
router.get("/myAppointments",isAuthenticated,isDoctor, myAppointments);
router.get("/pendingApts",isAuthenticated,isDoctor, pendingAppointments);
export default router
