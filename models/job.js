const db = require("../db");

class Job {
  /** Create a new job with data. Returns new job data. */

  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobs
         (title, salary, equity, company_handle)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );
    return result.rows[0];
  }

  /** Find all jobs. */

  static async findAll() {
    const result = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle
         FROM jobs
         ORDER BY title`
    );
    return result.rows;
  }

  /** Given a job id, return data about job. */

  static async get(id) {
    const result = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle
         FROM jobs
         WHERE id = $1`,
      [id]
    );
    const job = result.rows[0];
    if (!job) throw new Error(`No job with id ${id}`);
    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Return data for changed job.
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      JOB_UPDATE_SCHEMA_VALIDATOR
    );
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
      WHERE id = ${handleVarIdx}
      RETURNING id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
    `;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    // Prevent changing the ID or the company associated with the job
    if (data.id || data.companyHandle) {
      throw new BadRequestError(
        "Updating the ID or company of a job is not allowed"
      );
    }

    return job;
  }
}
module.exports = Job;