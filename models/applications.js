const db = require('../db');

class Application {
  /** Create a new application with `username`, `jobId` */
  static async create(username, job_id) {
    const result = await db.query(
      `INSERT INTO applications (username, job_id)
           VALUES ($1, $2)
           RETURNING username, job_id AS "job_id"`,
      [username, job_id]
    );
    return result.rows[0];
  }

  /** Delete the application with `username`, `jobId` */
  static async delete(username, job_id) {
    const result = await db.query(
      `DELETE FROM applications
           WHERE username = $1 AND job_id = $2
           RETURNING username, job_id AS "jobId"`,
      [username, job_id]
    );
    return result.rows[0];
  }
}

module.exports = Application;