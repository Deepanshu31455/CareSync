const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // true in production with HTTPS
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({
    message: "Logged out successfully",
  });
};

module.exports = { logout };