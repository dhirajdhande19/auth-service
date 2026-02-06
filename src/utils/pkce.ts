import crypto from "crypto";

// code_verifier
export const generateCodeVerifier = () => {
  return crypto.randomBytes(32).toString("base64url");
};

// code_challenge (SHA256 hash)
export const generateCodeChallenge = (verifier: string) => {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
};
