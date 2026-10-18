const jwt = require("jsonwebtoken");

const COOKIE_NAME = "token";
const TOKEN_TTL = "7d";

function signToken({ accountId, role }) {
  return jwt.sign({ accountId, role }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // not readable by client-side JS — protects against XSS
    secure: isProduction, // HTTPS required when sameSite is 'none'
    sameSite: isProduction ? "none" : "lax", // 'none' is mandatory for cross-domain cookies (frontend on Render -> backend on Render)
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches TOKEN_TTL
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
}

module.exports = { signToken, setAuthCookie, clearAuthCookie, COOKIE_NAME };
