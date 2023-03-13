// Import required modules
const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const { ensureLoggedIn, ensureAdmin, ensureJobOwnerOrAdmin } = require('../middleware/auth');

// GET route to get list of all jobs
router.get('/', ensureLoggedIn, async function(req, res, next) {
  try {
    const jobs = await Job.getAll();
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

// Create a new job (admins only)
router.post('/', ensureAdmin, async (req, res, next) => {
    try {
      const job = await Job.create(req.body);
      res.status(201).json({ job });
    } catch (err) {
      next(err);
    }
  });

// GET route to get a specific job by ID
router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const job = await Job.getById(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

// Update a job (admins or job owner only)
router.patch('/:id', ensureJobOwnerOrAdmin, async (req, res, next) => {
    try {
      const job = await req.job.update(req.body);
      res.json({ job });
    } catch (err) {
      next(err);
    }
  });

// Delete a job (admins or job owner only)
router.delete('/:id', ensureJobOwnerOrAdmin, async (req, res, next) => {
    try {
      await req.job.remove();
      res.json({ message: 'Job deleted' });
    } catch (err) {
      next(err);
    }
  });

// Export router
module.exports = router;