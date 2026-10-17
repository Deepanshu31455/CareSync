const { clearAuthCookie } = require("../utils/jwt");

const logout = (req, res) => {
  clearAuthCookie(res);

  return res.status(200).json({
    message: "Logged out successfully",
  });
};

module.exports = { logout };