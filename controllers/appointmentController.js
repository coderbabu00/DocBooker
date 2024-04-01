import Appointment from '../models/appointmentModel.js';
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import cloudinary from "cloudinary";
import sendToken from '../utils/jwtToken.js';
import sendMail from "../utils/sendMail.js";

// Book Appointment
export const bookAppointment = async (req, res, next) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dob,
            gender,
            appointment_date,
            department,
            doctor_firstName,
            doctor_lastName,
            address,
        } = req.body;

        // Validate required fields
        const requiredFields = {
            "First Name": firstName,
            "Last Name": lastName,
            "Email": email,
            "Phone": phone,
            "DOB": dob,
            "Gender": gender,
            "Appointment Date": appointment_date,
            "Department": department,
            "Doctor First Name": doctor_firstName,
            "Doctor Last Name": doctor_lastName,
            "Address": address,
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value)
            .map(([key, value]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `All Fields Are Required and missing fields are: ${missingFields.join(", ")}`,
            });
        }

        // Check if doctor exists and is available
        const doctors = await User.find({
            firstName: doctor_firstName,
            lastName: doctor_lastName,
            role: "Doctor",
            doctorDepartment: department,
        });

        if (doctors.length === 0) {
            return next(errorHandler("Doctor not found", 404));
        }

        if (doctors.length > 1) {
            return next(errorHandler(
                "Doctors Conflict! Please Contact Through Email Or Phone!",
                400
            ));
        }

        const doctorId = doctors[0]._id;
        const patientId = req.user._id;

        // Check if user has already created an appointment
        const existingAppointment = await Appointment.findOne({ patientId });

        if (existingAppointment) {
            return next(errorHandler("You already have an appointment", 400));
        }

        // Create new appointment
        const appointment = await Appointment.create({
            firstName,
            lastName,
            email,
            phone,
            dob,
            gender,
            appointment_date,
            department,
            doctor: {
                firstName: doctor_firstName,
                lastName: doctor_lastName,
            },
            address,
            doctorId,
            patientId,
        });

        // Add appointment to user's appointments
        appointment.Appointments.push(req.user._id);
        await appointment.save();

        // Send success response
        res.status(200).json({
            success: true,
            appointment,
            message: "Appointment Created Successfully!",
        });

        // Send notification email to patient
        await sendMail({
            email: email,
            subject: "Request sent",
            message: `Hello ${firstName}, Your appointment request has been sent and waiting for Dr. ${doctor_firstName} to confirm.`,
        });

        // Send notification email to doctor
        for (const doctor of doctors) {
            await sendMail({
                email: doctor.email,
                subject: "New Appointment",
                message: `Hello Dr. ${doctor_firstName}, There is a new patient waiting for you.`,
            });
        }
    } catch (error) {
        console.error("Error booking appointment:", error);
        next(error);
    }
};


// Get my Appointments (for doctors)
export const myAppointments = async (req, res, next) => {
    try{
        const appointments = await Appointment.find({doctorId: req.user._id});
        res.status(200).json({
            success: true,
            appointments
        })
    }catch(error){
        console.log(error)
        next(error)
    }
}

// Pending appointments
export const pendingAppointments = async (req, res, next) => {
    try {
        // Fetch appointments where status is "Pending" and doctorId matches the logged-in doctor's ID
        const appointments = await Appointment.find({ status: "Pending", doctorId: req.user._id });

        // Create an array to store user details for each appointment
        const users = [];

        // Fetch user details for each appointment
        for (let appointment of appointments) {
            const user = await User.findById(appointment.patientId);
            users.push(user); // Push user details to the array
        }

        res.status(200).json({
            success: true,
            appointments,
            users
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}


// Send A remark to reschedule appointment
export const rescheduleAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { remark } = req.body;
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return next(errorHandler("Appointment Not Found", 404));
        }
        appointment.remark = remark;
        await appointment.save();
        await sendMail({
            to: appointment.email,
            subject: "Appointment Rescheduled",
            message: `Your Appointment Is Rescheduled due to unavailability.`,
        })
        res.status(200).json({
            success: true,
            appointment,
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}

// Approve appointment
export const approveAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const approve = await Appointment.findByIdAndUpdate(id, { status: "Approved" });
        await sendMail({
            email: approve.email,
            subject: "Appointment Accepted",
            message: `Your Appointment Is Accepted`,
        })
        res.status(200).json({
            success: true,
            message: "Appointment Accepted",
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}

// Reject Appointment
export const rejectAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the appointment by ID and update its status to "Rejected"
        const appointment = await Appointment.findByIdAndUpdate(id, { status: "Rejected" }, { new: true });

        // Check if appointment exists
        if (!appointment) {
            return next(errorHandler("Appointment Not Found", 404));
        }

        // Send rejection email to the patient
        await sendMail({
            email: appointment.email,
            subject: "Appointment Rejected",
            message: `Your Appointment has been rejected.`,
        });

        res.status(200).json({
            success: true,
            message: "Appointment rejected successfully",
        });
    } catch (error) {
        console.error("Error rejecting appointment:", error);
        next(error);
    }
};

// Delete appointment
export const deleteAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Find the appointment by ID
        const appointment = await Appointment.findById(id);

        // Check if appointment exists
        if (!appointment) {
            return next(errorHandler("Appointment Not Found", 404));
        }

        // Extract doctor details from the appointment
        const { doctorId, email: patientEmail, appointment_date } = appointment;

        // Remove the appointment
        await appointment.remove();

        // Send cancellation notification emails
        await sendMail({
            email: patientEmail,
            subject: "Appointment Cancelled",
            message: `Your appointment on ${appointment_date} has been cancelled.`,
        });

        // Send cancellation notification email to the doctor
        const doctor = await User.findById(doctorId);
        if (doctor && doctor.email) {
            await sendMail({
                email: doctor.email,
                subject: "Appointment Cancelled",
                message: `An appointment on ${appointment_date} with a patient has been cancelled.`,
            });
        }

        // Send confirmation response
        res.status(200).json({
            success: true,
            message: "Appointment Deleted",
        });
    } catch (error) {
        console.error("Error deleting appointment:", error);
        next(error);
    }
};

// Appointment Success
export const appointmentSuccess = async (req, res, next) => {
    try {
        const { appointmentId } = req.body;

        // Find the appointment by ID
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return next(errorHandler("Appointment Not Found", 404));
        }

        // Update appointment status and set hasVisited flag to true
        appointment.status = "Accepted";
        appointment.hasVisited = true;

        // Save the updated appointment
        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Appointment marked as successful",
        });
    } catch (error) {
        console.error("Error marking appointment as successful:", error);
        next(error);
    }
};
