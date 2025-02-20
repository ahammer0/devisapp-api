import { Schema } from "node:inspector/promises";
import * as validators from "./validators";
import { assertDate } from "./datesHandlers";

//TODO add enum types

export type Schema = {
  [key: string]: DataRules;
};
type Data = {
  [key: string]: unknown;
};
// type OutputData = {
//   [K in keyof Schema]: Schema[K] extends StringRules
//     ? string
//     : Schema[K] extends NumberRules
//       ? number
//       : Schema[K] extends BooleanRules
//         ? boolean
//         : Schema[K] extends ArrayRules
//           ? OutputData[]
//           : Schema[K] extends ObjectRules
//             ? { [key in keyof Schema[K]["element"]]: OutputData[key] }
//             : Schema[K] extends DateRules
//               ? Date
//               : never;
// };
interface BaseRules {
  optional?: boolean;
  nullable?: boolean;
}
interface StringRules extends BaseRules {
  type: "string" | "email" | "password";
  minLength?: number;
  maxLength?: number;
}
interface NumberRules extends BaseRules {
  type: "number";
  float?: boolean;
  min?: number;
  max?: number;
}
interface DateRules extends BaseRules {
  type: "date";
  minDate?: Date;
  maxDate?: Date;
}
interface BooleanRules extends BaseRules {
  type: "boolean";
}
interface ObjectRules extends BaseRules {
  type: "object";
  element: Schema;
}
interface ArrayRules extends BaseRules {
  type: "array";
  element: Schema;
  minLength?: number;
  maxLength?: number;
}
type DataRules =
  | StringRules
  | NumberRules
  | ObjectRules
  | ArrayRules
  | DateRules
  | BooleanRules;

interface Options {
  enforceKeys?: boolean;
}

export default class DTO {
  data: Data;
  schema: Schema;
  options: Options | undefined;
  constructor(data: Data, schema: Schema, options?: Options) {
    this.data = data;
    this.schema = schema;
    this.options = options;
    this.validate();
  }
  validate() {
    DTO.validate(this.data, this.schema);
  }

  static trim(data: Data, schema: Schema, options?: Options) {
    //removing keys not in schema
    const exceddingKeys: string[] = [];
    for (const key of Object.keys(data)) {
      if (!schema[key]) {
        delete data[key];
        exceddingKeys.push(key);
      }
      if (exceddingKeys.length !== 0 && options?.enforceKeys) {
        throw new validators.InputError(
          "Too much keys provided. Keys: " + exceddingKeys.join(),
          "too_much_keys",
        );
      }
    }
  }
  //does nothing if data is valid according to Schema but throws error otherwise
  static validate(data: Data, schema: Schema, options?: Options) {
    DTO.trim(data, schema, options);
    //checking remaining keys
    for (const [key, rules] of Object.entries(schema)) {
      //if optional and undefined skip it
      if (data[key] === undefined && rules.optional) continue;
      if (data[key] === undefined) {
        throw new validators.InputError(
          `La clef ${key} est requise`,
          "missing_key",
        );
      }
      if (data[key] === null && rules.nullable) continue;
      if (data[key] === null) {
        throw new validators.InputError(
          `La clef ${key} est requise mais elle est null`,
          "missing_key",
        );
      }

      if (typeof data[key] === "object" && DTO.isEmptyObject(data[key])) {
        throw new validators.InputError(
          `La clef ${key} est requise mais elle est vide`,
          "missing_key",
        );
      }
      if (rules.type === "array") {
        if (DTO.isArray(data[key])) {
          DTO.validateArray(data[key], rules, key);
        } else {
          throw new validators.InputError(
            `La clef ${key} doit être un tableau`,
            "not_array",
          );
        }
      } else if (rules.type === "object") {
        if (DTO.isObject(data[key])) {
          //@ts-expect-error data[key] is indeed Object type
          DTO.validate(data[key], rules.element);
        } else {
          throw new validators.InputError(
            `la clé ${key} devrait etre un objet`,
            "not_object",
          );
        }
      }
      //else it's a simple value check it
      switch (rules.type) {
        case "email":
          data[key] = DTO.validateEmail(data[key], rules, key);
          break;
        case "string":
          data[key] = DTO.validateString(data[key], rules, key);
          break;
        case "number":
          try {
            if (typeof data[key] === "string") {
              if (rules.float === true) {
                data[key] = parseFloat(data[key]);
              } else {
                data[key] = parseInt(data[key]);
              }
            }
          } catch {
            throw new validators.InputError(
              `la clé ${key} devrait etre un nombre`,
              "not_number",
            );
          }
          data[key] = DTO.validateNumber(data[key], rules, key) as number;
          break;
        case "password":
          data[key] = DTO.validatePassword(data[key], rules, key);
          break;
        case "boolean":
          data[key] = DTO.validateBoolean(data[key], key);
          break;
        case "date":
          try {
            data[key] = assertDate(data[key]);
          } catch {
            throw new validators.InputError(
              `la date ${key} fourrnie n'est pas valide`,
              "not_date_object",
            );
          }
          data[key] = DTO.validateDate(data[key], rules, key);
          break;
      }
    }
  }
  static validateArray(arr: unknown[], type: ArrayRules, key: string) {
    if (!(arr instanceof Array)) {
      throw new validators.InputError(`expecting array in ${key}`, "not_array");
    }
    if (type.minLength && arr.length < type.minLength) {
      throw new validators.InputError(
        `array ${key} should be at least  ${type.minLength} elements long`,
        "out_of_range",
      );
    }
    if (type.maxLength && arr.length > type.maxLength) {
      throw new validators.InputError(
        `Le tableau ${key} should be less than   ${type.maxLength}   elements long`,
        "out_of_range",
      );
    }

    arr.forEach((el) => {
      DTO.validate(el as Data, type.element);
    });
  }
  static validateString(str: unknown, type: StringRules, key: string): string {
    if (typeof str !== "string") {
      throw new validators.InputError(
        `le champ ${key} doit être une chaine de caractères`,
        "not_string",
      );
    }
    validators.textValidator(str);
    if (type.minLength && str.length < type.minLength) {
      throw new validators.InputError(
        `Dans le champ ${key} string '${str}' doit etre plus grande que ${type.minLength} caractères`,
        "out_of_range",
      );
    }
    if (type.maxLength && str.length > type.maxLength) {
      throw new validators.InputError(
        `Dans le champ ${key} string '${str}' doit etre plus petite que ${type.maxLength} caractères`,
        "out_of_range",
      );
    }
    return str as string;
  }
  static validateNumber(num: unknown, type: NumberRules, key: string): number {
    if (typeof num !== "number") {
      throw new validators.InputError(
        `le champ ${key} doit etre un nombre`,
        "not_number",
      );
    }
    if (type.min && num < type.min) {
      throw new validators.InputError(
        `Dans le champ ${key}, le nombre ${num} doit etre au moins ${type.min}`,
        "out_of_range",
      );
    }
    if (type.max && num > type.max) {
      throw new validators.InputError(
        `Dans le champ ${key}, le nombre ${num} doit etre moins de ${type.max}`,
        "out_of_range",
      );
    }
    return num as number;
  }
  static validateBoolean(bool: unknown, key: string): boolean {
    if (typeof bool !== "boolean") {
      throw new validators.InputError(
        `le champ ${key} doit etre un boolean`,
        "not_boolean",
      );
    }
    return bool;
  }
  static validateDate(date: unknown, type: DateRules, key: string): Date {
    if (!(date instanceof Date)) {
      throw new validators.InputError(
        `la date ${key} n'est pas un Date`,
        "not_date_object",
      );
    }
    if (type.minDate && date.getTime() < type.minDate.getTime()) {
      throw new validators.InputError(
        `La date ${key} fourrnie doit etre après ${type.minDate} `,
        "out_of_range",
      );
    }
    if (type.maxDate && date.getTime() > type.maxDate.getTime()) {
      throw new validators.InputError(
        `La date ${key} fourrnie doit etre avant ${type.maxDate} `,
        "out_of_range",
      );
    }
    return date;
  }
  static validateEmail(str: unknown, type: StringRules, key: string): string {
    if (typeof str !== "string") {
      throw new validators.InputError(
        "l' email fourni n' est pas valide,champ: " + key,
        "invalid_email",
      );
    }
    DTO.validateString(str, type, key);
    validators.emailValidator(str);
    return str;
  }
  static validatePassword(
    str: unknown,
    type: StringRules,
    key: string,
  ): string {
    if (typeof str !== "string") {
      throw new validators.InputError(
        `le champ ${key} doit être une chaine de caractères`,
        "not_string",
      );
    }
    DTO.validateString(str, type, key);
    validators.passwordValidator(str);
    return str;
  }

  static isObject(value: unknown) {
    return (
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    );
  }

  static isArray(value: unknown) {
    return Array.isArray(value);
  }

  static isEmptyObject(obj: object) {
    return Object.keys(obj).length === 0;
  }
}
