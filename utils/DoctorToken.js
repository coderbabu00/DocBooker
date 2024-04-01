const doctorToken = (user, statusCode, res) => {
    const token = user.generateJsonWebToken();

    res.status(statusCode).cookie("token", token, {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
        secure: true,
    }).json({
        success: true,
        user,
        token,
    });
}

export default doctorToken