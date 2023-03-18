const db = require('../db');
const Job = require('./job.js');

describe('Job', () => {
  beforeAll(async () => {
    await db.query('DELETE FROM jobs');
    await db.query('DELETE FROM companies');
    await db.query(`INSERT INTO companies (handle, name, num_employees)
                    VALUES ('c1', 'C1', 10),
                           ('c2', 'C2', 20)`);
  });

  beforeEach(async () => {
    await db.query('DELETE FROM jobs');
  });

  afterAll(async () => {
    await db.end();
  });

  describe('create', () => {
    it('should create a new job', async () => {
      const job = await Job.create({
        title: 'Test Job',
        salary: 50000,
        equity: 0.1,
        companyHandle: 'c1'
      });

      expect(job).toEqual({
        id: expect.any(Number),
        title: 'Test Job',
        salary: 50000,
        equity: '0.1',
        companyHandle: 'c1'
      });

      const result = await db.query('SELECT * FROM jobs WHERE id = $1', [job.id]);
      expect(result.rows).toEqual([
        {
          id: job.id,
          title: 'Test Job',
          salary: 50000,
          equity: '0.1',
          company_handle: 'c1'
        }
      ]);
    });
  });

  describe('findAll', () => {
    it('should return a list of all jobs', async () => {
      await db.query(`INSERT INTO jobs (title, salary, equity, company_handle)
                      VALUES ('Test Job 1', 50000, 0.1, 'c1'),
                             ('Test Job 2', 60000, 0.2, 'c2')`);

      const jobs = await Job.findAll();
      expect(jobs).toEqual([
        {
          id: expect.any(Number),
          title: 'Test Job 1',
          salary: 50000,
          equity: '0.1',
          companyHandle: 'c1'
        },
        {
          id: expect.any(Number),
          title: 'Test Job 2',
          salary: 60000,
          equity: '0.2',
          companyHandle: 'c2'
        }
      ]);
    });
  });

  describe('get', () => {
    it('should return a job by ID', async () => {
      const result = await db.query(
        `INSERT INTO jobs (title, salary, equity, company_handle)
         VALUES ('Test Job', 50000, 0.1, 'c1')
         RETURNING id, title, salary, equity, company_handle`
      );
      const job = await Job.get(result.rows[0].id);

      expect(job).toEqual({
        id: result.rows[0].id,
        title: 'Test Job',
        salary: 50000,
        equity: '0.1',
        companyHandle: 'c1'
      });
    });

    it('should return null if job not found', async () => {
      const job = await Job.get(999);
      expect(job).toBe(null);
    });
  });
});