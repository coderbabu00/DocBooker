# DocBooker Backend

Welcome to DocBooker Backend – your solution for seamless doctor appointment bookings!

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

DocBooker Backend is a robust backend solution for a doctor appointment booking application. It provides advanced authentication features such as password reset and email verification. Leveraging Nodemailer, the backend ensures effective communication by sending email notifications to users for appointment actions.

## Features

- **Advanced Authentication**: Users can reset their passwords and verify their email addresses.
- **Email Notifications**: Nodemailer is utilized to send email notifications to users for appointment actions.
- **Scalability**: Built on Node.js and Express.js, the backend is highly scalable and can handle a large number of requests efficiently.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/docbooker-backend.git
npm install

2. Setup .env file
   PORT = 9700
DB_URL = ""

JWT_SECRET = "" 
JWT_EXPIRES = 
ACTIVATION_SECRET = ""

SMPT_SERVICE = gmail
SMPT_HOST = smtp.gmail.com
SMPT_PORT = 465 
SMPT_PASSWORD =
SMPT_MAIL = 

CLOUDINARY_NAME= 
CLOUDINARY_API_KEY=  
CLOUDINARY_SECRET=  
NODE_ENV = Production
STRIPE_API_KEY=.........................................
STRIPE_API_SECRET=.........................................
