const request = require('supertest');
const app = require('../app');
const db = require('../db');

// Before all tests, create a test job
beforeEach(async () => {
  await db.query("INSERT INTO jobs (title, salary, equity, company_handle) VALUES ('Test Job', 50000, 0.1, 'c1')");
});


// After all tests, delete the test job and close database connection
afterEach(async () => {
  await db.query("DELETE FROM jobs");
});

afterAll(async () => {
  await db.end();
});

describe('GET /jobs', () => {
  test('should respond with a list of all jobs', async () => {
    const response = await request(app)
      .get('/jobs')
      .set('Cookie', ['_token=testtoken']);

    expect(response.statusCode).toBe(200);
    expect(response.body.jobs.length).toBe(1);
    expect(response.body.jobs[0].title).toBe('Test Job');
  });

  test('should return 401 unauthorized when no token provided', async () => {
    const response = await request(app).get('/jobs');

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /jobs/new', function() {
    test('admin can create new job', async function() {
      // Log in as admin
      const adminToken = await loginAsAdmin();
  
      const response = await request(app)
        .post('/jobs/new')
        .send({
          title: 'New Job',
          salary: 70000,
          equity: 0.1,
          company_handle: 'c1'
        })
        .set('authorization', adminToken);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.job).toHaveProperty('title', 'New Job');
      expect(response.body.job).toHaveProperty('salary', 70000);
      expect(response.body.job).toHaveProperty('equity', 0.1);
      expect(response.body.job).toHaveProperty('company_handle', 'c1');
    });
  
    test('non-admin user cannot create new job', async function() {
      // Log in as regular user
      const userToken = await loginAsUser();
  
      const response = await request(app)
        .post('/jobs/new')
        .send({
          title: 'New Job',
          salary: 70000,
          equity: 0.1,
          company_handle: 'c1'
        })
        .set('authorization', userToken);
      
      expect(response.statusCode).toBe(401);
    });
  
    test('creating job with missing required fields should return error', async function() {
      // Log in as admin
      const adminToken = await loginAsAdmin();
  
      const response = await request(app)
        .post('/jobs/new')
        .send({
          salary: 70000,
          equity: 0.1,
          company_handle: 'c1'
        })
        .set('authorization', adminToken);
      
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual('Missing fields: title');
    });
  });
