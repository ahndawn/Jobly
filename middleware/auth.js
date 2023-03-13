const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      const payload = jwt.verify(token, SECRET_KEY);
      res.locals.user = {
        username: payload.username,
        isAdmin: payload.isAdmin
      };
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

// Middleware to check if user is an admin
function ensureAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.is_admin) {
      throw new ExpressError('Unauthorized', 401);
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

// Middleware to check if user is an admin or the job's owner
async function ensureJobOwnerOrAdmin(req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    if (!req.user || (req.user.role !== 'admin' && req.user.username !== job.username)) {
      const err = new Error('Unauthorized');
      err.status = 401;
      return next(err);
    }
    req.job = job;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureJobOwnerOrAdmin
};