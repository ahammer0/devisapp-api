export const assertDate = (date: unknown) => {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === "string") {
    const test = new Date(date);
    if (test.toString() === "Invalid Date") {
      throw new Error("Invalid date string given");
    }
    return test;
  }
  throw new Error("Invalid date string given");
};

export const isPast = (date: Date | string) => {
  const a = assertDate(date);
  return a.valueOf() < new Date().valueOf();
};

export const addMonths = (date: string | Date, n: number) => {
  const a = assertDate(date);
  a.setMonth(a.getMonth() + n);
  return a;
};

export const toFormDateString = (date: string | Date) => {
  if (typeof date === "string") {
    const test = new Date(date);
    if (test.toString() !== "Invalid Date") {
      return test.toISOString().split("T")[0];
    }
  }
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }
  return date.split(" ")[0];
};
