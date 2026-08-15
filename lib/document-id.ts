export const normalizeDocumentId = (value: number | string) => {
  if (typeof value === "number") {
    return value;
  }

  return /^\d+$/.test(value) ? Number(value) : value;
};
