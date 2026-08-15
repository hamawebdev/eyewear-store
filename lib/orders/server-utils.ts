import { randomBytes } from "node:crypto";

export const formatOrderRef = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();

  return `ORD-${datePart}-${suffix}`;
};
