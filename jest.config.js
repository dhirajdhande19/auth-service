const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/unit/**/*.test.ts", "**/integration/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js"],
  clearMocks: true,
};
