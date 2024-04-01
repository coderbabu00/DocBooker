import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import {errorHandler} from "../utils/error.js";
export const isAuthenticated = async (req, res, next) => {
    try{
        const { token } = req.cookies; 
     if(!token){
        next(errorHandler("Please Login First", 401));
     }
     const deCodeToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(deCodeToken.id);
    req.user = user;
    next();
    }catch(error){
        console.log(error)
        next(error)
    }
}

// Doctor Auth 
export const isDoctor = async (req, res, next) => {
    try{
        const {role} = req.user;
        if(role !== "Doctor"){
            next(errorHandler("Only Doctors Are Allowed", 403));
        }
        next();
    }catch(error){
        console.log(error)
        next(error)
    }
}

export const isPatient = async (req, res, next) => {
    try{
        const {role} = req.user;
        if(role !== "Patient"){
            next(errorHandler("Only Patients Are Allowed", 403));
        }
        next();
    }catch(error){
        console.log(error)
        next(error)
    }
}