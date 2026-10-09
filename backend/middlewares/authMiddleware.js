const jwt    = require("jsonwebtoken");

/**
 * Reads the JWT from the httpOnly cookie and attaches
 *   req.user = { accountId, role }
 * so protected routes know who is calling.
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated — please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { accountId, role, iat, exp }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired — please log in again." });
  }
}

module.exports = { authMiddleware };

