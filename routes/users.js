"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    // Check if user is an admin
    if (!res.locals.user.isAdmin) {
      throw new BadRequestError("You must be an admin user to create a new user");
    }

    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 **/

router.get("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

function ensureAdmin(req, res, next) {
  try {
    if (res.locals.user && res.locals.user.isAdmin) {
      return next();
    }
    throw new UnauthorizedError();
  } catch (err) {
    return next(err);
  }
}

// Get user by username with getUser method 
//in models/user.js to include the list of job IDs the user has applied for:
router.get('/:username', ensureLoggedIn, async function(req, res, next) {
  try {
    const user = await User.getUser(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/

router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    
    // Check if the user making the request is an admin or the same user whose information is being requested
    if (!res.locals.user.isAdmin && res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError("You are not authorized to access this resource");
    }
    
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    // Check if the user making the request is an admin or the same user whose information is being updated
    if (!res.locals.user.isAdmin && res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError("You are not authorized to access this resource");
    }
    
    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 **/

router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    // Check if the user making the request is an admin or the same user whose information is being deleted
    if (!res.locals.user.isAdmin && res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError("You are not authorized to access this resource");
    }
    
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

//
router.post('/:username/jobs/:id', ensureJobOwnerOrAdmin, async (req, res, next) => {
  try {
    const { username, job_id } = req.params;
    const result = await User.applyToJob(username, job_id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});
