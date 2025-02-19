type ErrorType =
  | "invalid_email"
  | "insecure_password"
  | "not_string"
  | "not_number"
  | "not_boolean"
  | "not_date_object"
  | "wrong_type"
  | "out_of_range"
  | "missing_key"
  | "too_much_keys";

export class InputError extends Error {
  type?: ErrorType;
  constructor(message: string, type?: ErrorType) {
    super(message);
    this.type = type;
  }
}

export const emailValidator = (i: string) => {
  const re = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/gm; //eslint-disable-line
  if (re.test(i)) return i;
  throw new InputError("l'Email Fourni n'est pas valide", "invalid_email");
};
export const passwordValidator = (p: string) => {
  const re = /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "\.,]).*$/gm; //eslint-disable-line
  if (re.test(p)) return p;
  throw new InputError(
    "Le Mot de passe fourni n'est pas assez sécurisé",
    "insecure_password",
  );
};
export const textValidator = (t: number | string) => {
  if (typeof t === "string") return t;
  if (typeof t === "number") return t.toString();
  throw new InputError(
    "L'entrée fournie n'est pas un texte valide",
    "not_string",
  );
};
export const numberValidator = (n: number | string) => {
  if (typeof n === "string") {
    const re = /^[\d]+\.?[\d]*$/gm;
    if (re.test(n)) return parseInt(n);
  }
  if (typeof n === "number") return n;
  throw new InputError(
    "L'entrée fournie n'est pas un nombre entier valide",
    "not_number",
  );
};
