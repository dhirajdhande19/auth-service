import { Request, Response } from "express";
import { redis } from "../../config/redis";
import { compare, hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../../config/env";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;
  const isPrevUser = await redis.hget(`user: ${email}`, "id");

  if (isPrevUser) {
    res.status(409).json({
      message: `User with given email already exists, try new email!`,
    });
    return;
  }

  const hashedPassword = await hash(password, 10);

  const userData = {
    id: crypto.randomUUID(),
    role: "User",
    password: hashedPassword,
  };

  await redis.hset(`user: ${email}`, userData);

  res.status(201).json({ message: "User Registered Successfully!" });
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const isPrevUser = await redis.hget(`user: ${email}`, "id");
  const userData = await redis.hgetall(`user: ${email}`);

  if (!isPrevUser) {
    res.status(404).json({
      message: `No user found with given email, Register first!`,
    });
    return;
  }

  const hashedPassword = userData?.password;
  if (!hashedPassword) {
    res.status(500).json({ message: "Could not find password in redis!" });
    return;
  }

  const isPasswordCorrect = await compare(password, hashedPassword);
  if (!isPasswordCorrect) {
    res.status(401).json({ message: "Unauthorized!" });
    return;
  }

  const token = jwt.sign(
    { id: userData.id, email: email, role: userData.role },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    },
  );

  res.status(200).json({ token: token });
};

// unit testing functions
// register
export const registerUserTest = async (
  email: string,
  password: string,
): Promise<boolean> => {
  const isPrevUser = await redis.hget(`user: ${email}`, "id");

  if (isPrevUser) {
    console.log({
      message: `User with given email already exists, try new email!`,
    });
    return false;
  }

  const hashedPassword = await hash(password, 10);

  const userData = {
    id: crypto.randomUUID(),
    role: "User",
    password: hashedPassword,
  };

  await redis.hset(`user: ${email}`, userData);
  await redis.expire(`user: ${email}`, 60);
  console.log({ message: "User Registered Successfully!" });
  return true;
};

// login
export const loginUserTest = async (
  email: string,
  password: string,
): Promise<boolean> => {
  const isPrevUser = await redis.hget(`user: ${email}`, "id");
  const userData = await redis.hgetall(`user: ${email}`);

  if (!isPrevUser) {
    console.log({ message: `No user found with given email, Register first!` });
    return false;
  }

  const hashedPassword = userData?.password;
  if (!hashedPassword) {
    console.log({ message: "Could not find password in redis!" });
    return false;
  }

  const isPasswordCorrect = await compare(password, hashedPassword);
  if (!isPasswordCorrect) {
    console.log({ message: "Unauthorized!" });
    return false;
  }

  const token = jwt.sign(
    { id: userData.id, email: email, role: userData.role },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    },
  );

  console.log(token);
  return true;
};
