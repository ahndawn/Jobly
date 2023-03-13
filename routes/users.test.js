"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const User = require("../models/user");
const { TEST_DATA, beforeEachHook } = require("./jest.config");
const { createToken } = require("../helpers/tokens");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for users: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for users: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for users", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});


//tests for how creating users should only permitted by admins
beforeEach(async function () {
  await beforeEachHook(TEST_DATA);
});

afterAll(async function () {
  await db.end();
});

describe("POST /users", function () {
  test("creating a user without logging in as an admin should return a 401 unauthorized error", async function () {
    const response = await request(app)
      .post("/users")
      .send({
        username: "testuser",
        password: "password",
        firstName: "Test",
        lastName: "User",
        email: "testuser@test.com",
      })
      .set("Authorization", `Bearer ${TEST_DATA.userToken}`);

    expect(response.statusCode).toBe(401);
  });

  test("creating a user while logged in as an admin should return a 201 status code and the new user", async function () {
    const response = await request(app)
      .post("/users")
      .send({
        username: "newuser",
        password: "password",
        firstName: "New",
        lastName: "User",
        email: "newuser@test.com",
      })
      .set("Authorization", `Bearer ${TEST_DATA.adminToken}`);

    expect(response.statusCode).toBe(201);
    expect(response.body.user.username).toEqual("newuser");
    expect(response.body.user.firstName).toEqual("New");
    expect(response.body.user.lastName).toEqual("User");
    expect(response.body.user.email).toEqual("newuser@test.com");
    expect(response.body.user.isAdmin).toEqual(false);
  });

  test("creating a user while logged in as a regular user should return a 401 unauthorized error", async function () {
    const response = await request(app)
      .post("/users")
      .send({
        username: "newuser",
        password: "password",
        firstName: "New",
        lastName: "User",
        email: "newuser@test.com",
      })
      .set("Authorization", `Bearer ${TEST_DATA.user2Token}`);

    expect(response.statusCode).toBe(401);
  });
});



//tests for how Getting the list of all users should only be permitted by admins.
describe("GET /users", function () {
  let adminToken;
  let nonAdminToken;

  beforeEach(async function () {
    await db.query("DELETE FROM users");

    // Create an admin user
    const admin = await User.register({
      username: "admin",
      password: "password",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      isAdmin: true,
    });
    adminToken = createToken(admin);

    // Create a non-admin user
    const nonAdmin = await User.register({
      username: "user",
      password: "password",
      firstName: "Regular",
      lastName: "User",
      email: "user@example.com",
      isAdmin: false,
    });
    nonAdminToken = createToken(nonAdmin);
  });

  test("only permits access by admins", async function () {
    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${nonAdminToken}`);
    expect(response.statusCode).toBe(401);
  });

  test("returns list of all users when accessed by an admin", async function () {
    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      users: [
        {
          username: "admin",
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
        },
        {
          username: "user",
          firstName: "Regular",
          lastName: "User",
          email: "user@example.com",
        },
      ],
    });
  });
});

// tests for getting information on a user, 
// updating, or deleting a user should only 
// be permitted either by an admin, or by that user.
describe("User routes test", function () {
  let adminToken;
  let userToken;

  beforeEach(async function () {
    await db.query("DELETE FROM users");
    const admin = await User.register({
      username: "admin",
      password: "password",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      isAdmin: true,
    });
    adminToken = admin.token;
    const user = await User.register({
      username: "user",
      password: "password",
      firstName: "Regular",
      lastName: "User",
      email: "user@example.com",
    });
    userToken = user.token;
  });
});

  describe("POST /users", function () {
    test("creating user should be permitted by admin", async function () {
      const response = await request(app)
        .post("/users")
        .send({
          username: "newuser",
          password: "password",
          firstName: "New",
          lastName: "User",
          email: "newuser@example.com",
        })
        .set("Authorization", `Bearer ${adminToken}`);
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          user: {
            username: "newuser",
            firstName: "New",
            lastName: "User",
            email: "newuser@example.com",
            isAdmin: false,
          },
          token: expect.any(String),
        })
      );
    });

    test("creating user should not be permitted by non-admin user", async function () {
      const response = await request(app)
        .post("/users")
        .send({
          username: "newuser",
          password: "password",
          firstName: "New",
          lastName: "User",
          email: "newuser@example.com",
        })
        .set("Authorization", `Bearer ${userToken}`);
      expect(response.statusCode).toBe(400);
    });

    test("registration should remain open to everyone", async function () {
      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "newuser",
          password: "password",
          firstName: "New",
          lastName: "User",
          email: "newuser@example.com",
        });
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          token: expect.any(String),
        })
      );
    });
  });

  describe("GET /users", function () {
    test("getting list of users should be permitted by admin", async function () {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          users: expect.any(Array),
        })
      );
    });

    test("getting list of users should not be permitted by non-admin user", async function () {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${userToken}`);
      expect(response.statusCode).toBe(400);
    });
  });