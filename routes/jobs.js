// Import required modules
const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const { ensureLoggedIn, ensureAdmin, ensureJobOwnerOrAdmin } = require('../middleware/auth');

// GET route to get list of all jobs
router.get('/jobs', ensureLoggedIn, async function(req, res, next) {
  try {
    const jobs = await Job.getAll();
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

// Create a new job (admins only)
router.post('/jobs/new', ensureAdmin, async (req, res, next) => {
    try {
      const job = await Job.create(req.body);
      res.status(201).json({ job });
    } catch (err) {
      next(err);
    }
  });

// GET route to get a specific job by ID
router.get('/jobs/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const job = await Job.getById(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

// Update a job (admins or job owner only)
router.patch('/jobs/update/:id', ensureJobOwnerOrAdmin, async (req, res, next) => {
    try {
      const job = await req.job.update(req.body);
      res.json({ job });
    } catch (err) {
      next(err);
    }
  });

// Delete a job (admins or job owner only)
router.delete('jobs/delete/:id', ensureJobOwnerOrAdmin, async (req, res, next) => {
    try {
      await req.job.remove();
      res.json({ message: 'Job deleted' });
    } catch (err) {
      next(err);
    }
  });

// GET /jobs route with search by title
router.get('/jobs/title', async function(req, res, next) {
  try {
    const { title } = req.query;

    let jobs;
    if (title) {
      jobs = await Job.filterByTitle(title);
    } else {
      jobs = await Job.findAll();
    }

    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

// GET /jobs by minimum
router.get('/jobs/min-salary/:minSalary', async (req, res, next) => {
  try {
    const { minSalary } = req.query;
    let query = `SELECT id, title, salary, equity, company_handle 
                 FROM jobs`;

    if (minSalary) {
      query += ` WHERE salary >= $1`;
    }

    const result = await db.query(query, [minSalary]);
    return res.json({ jobs: result.rows });
  } catch (err) {
    return next(err);
  }
});

// filters by equity 
router.get('/jobs/equity', async (req, res, next) => {
  try {
    const hasEquity = req.query.hasEquity === 'true';
    let result;

    if (hasEquity) {
      result = await Job.findAll({
        where: {
          equity: { [Op.gt]: 0 }
        }
      });
    } else {
      result = await Job.findAll();
    }

    return res.json({ jobs: result });
  } catch (err) {
    return next(err);
  }
});

// Export router
module.exports = router;