const jwt = require("jsonwebtoken");

const COOKIE_NAME = "token";
const TOKEN_TTL = "7d";

function signToken({ accountId, role }) {
  return jwt.sign({ accountId, role }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // not readable by client-side JS — protects against XSS stealing it
    //HTTPS is secure and encrypted, while HTTP sends all data as plain text that anyone can read if they intercept it
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod; localhost is fine over http in dev
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches TOKEN_TTL
  });
}
function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

module.exports = { signToken, setAuthCookie, clearAuthCookie, COOKIE_NAME };
