// unit testing for auth

import { redis } from "../../config/redis";
import { registerUserTest, loginUserTest } from "./auth.controller";

const email = "test@gmail.com";
const password = "12345";

// createuser (register)
// register with new email
test("Should pass (return true)", async () => {
  const data1 = await registerUserTest(email, password);
  expect(data1).toBeTruthy(); // pass
});
// register with same email
test("Should fail (return false)", async () => {
  const data2 = await registerUserTest(email, password); // could have used differnt password, tho doesn't matter anyways
  expect(data2).toBeFalsy(); // fail
});

// verfiy passwords (login)
// login with correct password
test("should pass (return true)", async () => {
  const res = await loginUserTest(email, password);
  expect(res).toBeTruthy(); // pass
});
// login with wrong password
test("should fail (return false)", async () => {
  const res = await loginUserTest(email, "54321"); // wrong password
  expect(res).toBeFalsy(); // fail
});

// close redis when all tests are done
afterAll(async () => {
  await redis.quit();
});
