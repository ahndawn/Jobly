"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const companies = await Company.findAll();
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

// filter by company name:
router.get('/companies', async (req, res, next) => {
  try {
    const nameFilter = req.query.name;
    let companies;
    if (nameFilter) {
      companies = await Company.filterByName(nameFilter);
    } else {
      companies = await Company.findAll();
    }
    res.json(companies);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

//filter by companies that have at least that number of employees 
router.get('/companies', async function(req, res, next) {
  const minEmployees = parseInt(req.query.minEmployees);

  if (isNaN(minEmployees)) {
    const error = new BadRequestError('minEmployees must be a number');
    return next(error);
  }

  const companies = await Company.findByMinEmployees(minEmployees);
  return res.json({ companies });
});

//filter to companies that have no more than that number of employees.
router.get('/companies', async (req, res, next) => {
  try {
    const { maxEmployees } = req.query;

    if (maxEmployees) {
      const companies = await Company.filterByMaxEmployees(maxEmployees);
      return res.json({ companies });
    }

    const companies = await Company.findAll();
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

//If the minEmployees parameter is greater than the maxEmployees parameter, respond with a 400 error with an appropriate message.
router.get("/",
  async function (req, res, next) {
    try {
      const { name, minEmployees, maxEmployees } = req.query;

      // Check if minEmployees is greater than maxEmployees
      if (minEmployees && maxEmployees && Number(minEmployees) > Number(maxEmployees)) {
        throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
      }

      const companies = await Company.findAll({ name, minEmployees, maxEmployees });
      return res.json({ companies });
    } catch (err) {
      return next(err);
    }
  });
/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /companies/[handle]
 *
 * Delete an existing company.
 *
 * Returns:
 *   { deleted: handle }
 *
 * Authorization required: Admin user
 */

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    const isAdmin = res.locals.user.isAdmin;
    if (!isAdmin) {
      throw new BadRequestError("You must be an admin user to delete a company");
    }
    const handle = req.params.handle;

    const result = await db.query(
      `DELETE FROM companies WHERE handle = $1 RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return res.json({ deleted: handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
