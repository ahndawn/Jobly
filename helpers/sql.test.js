const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", () => {
  test("returns the correct SQL statement and values for valid input", () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };
    const jsToSql = { firstName: 'first_name' };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ['Aliya', 32]
    });
  });

  test("throws BadRequestError when no data is provided", () => {
    const dataToUpdate = {};
    const jsToSql = { firstName: 'first_name' };
    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrow(BadRequestError);
  });

  test("returns the correct SQL statement and values when jsToSql is not provided", () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };
    const result = sqlForPartialUpdate(dataToUpdate);
    expect(result).toEqual({
      setCols: '"firstName"=$1, "age"=$2',
      values: ['Aliya', 32]
    });
  });

  test("uses the correct SQL column name when jsToSql is provided", () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };
    const jsToSql = { firstName: 'first_name' };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result.setCols).toContain('"first_name"=$1');
  });

  test("uses the original JavaScript key when jsToSql is not provided", () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };
    const result = sqlForPartialUpdate(dataToUpdate);
    expect(result.setCols).toContain('"firstName"=$1');
  });
});