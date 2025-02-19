import { Schema } from "node:inspector/promises";
import * as validators from "./validators";

export type Schema = {
  [key: string]: DataRules;
};
type DataType = string | number | boolean | Date | Data;
type Data = {
  [P in keyof Schema]: DataType;
};
interface BaseRules {
  optional?: boolean;
}
interface StringRules extends BaseRules {
  type: "string" | "email" | "password";
  minLength?: number;
  maxLength?: number;
}
interface NumberRules extends BaseRules {
  type: "number";
  min?: number;
  max?: number;
}
interface ObjectRules extends BaseRules {
  element: Schema;
}
interface DateRules extends BaseRules {
  type: "date";
  minDate?: Date;
  maxDate?: Date;
}
interface BooleanRules extends BaseRules {
  type: "boolean";
}
type DataRules =
  | StringRules
  | NumberRules
  | ObjectRules
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
    parseKeys: for (const [key, rules] of Object.entries(schema)) {
      //if optional and undefined skip it
      if (data[key] === undefined && rules.optional) continue;
      if (data[key] === undefined) {
        throw new validators.InputError(
          `La clef ${key} est requise`,
          "missing_key",
        );
      }

      if ("element" in rules) {
        if (typeof data[key] === "object" && !(data[key] instanceof Date)) {
          //when no type in schema we're looking for nested schema
          DTO.validate(data[key], rules.element);
        } else {
          throw new validators.InputError(
            `Expecting general object in ${key} but got ${typeof data[key]}`,
          );
        }
        continue parseKeys;
      }
      //else it's a simple value check it
      switch (rules.type) {
        case "email":
          DTO.validateEmail(data[key], rules);
          break;
        case "string":
          DTO.validateString(data[key], rules);
          break;
        case "number":
          DTO.validateNumber(data[key], rules);
          break;
        case "password":
          DTO.validatePassword(data[key], rules);
          break;
        case "boolean":
          DTO.validateBoolean(data[key]);
          break;
        case "date":
          DTO.validateDate(data[key], rules);
          break;
      }
    }
  }
  static validateString(str: DataType, type: StringRules) {
    if (typeof str !== "string") {
      throw new validators.InputError(
        `le champ fourni doit être une chaine de caractères`,
        "not_string",
      );
    }
    validators.textValidator(str);
    if (type.minLength && str.length <= type.minLength) {
      throw new validators.InputError(
        `string ${str} should be at least ${type.minLength} characters long`,
        "out_of_range",
      );
    }
    if (type.maxLength && str.length >= type.maxLength) {
      throw new validators.InputError(
        `string ${str} should be less than ${type.maxLength} characters long`,
        "out_of_range",
      );
    }
  }
  static validateNumber(num: DataType, type: NumberRules) {
    if (typeof num !== "number") {
      throw new validators.InputError(
        "le champ fourni doit etre un nombre",
        "not_number",
      );
    }
    if (type.min && num <= type.min) {
      throw new validators.InputError(
        `number ${num} should be at least ${type.min}`,
        "out_of_range",
      );
    }
    if (type.max && num >= type.max) {
      throw new validators.InputError(
        `number ${num} should be less than ${type.max}`,
        "out_of_range",
      );
    }
  }
  static validateBoolean(bool: DataType) {
    if (typeof bool !== "boolean") {
      throw new validators.InputError(
        "le champ fourni doit etre un boolean",
        "not_boolean",
      );
    }
  }
  static validateDate(date: DataType, type: DateRules) {
    if (!(date instanceof Date)) {
      throw new validators.InputError(
        "la date fourni n'est pas un Date",
        "not_date_object",
      );
    }
    if (type.minDate && date.getTime() <= type.minDate.getTime()) {
      throw new validators.InputError(
        `La date fourrnie doit etre après ${type.minDate} `,
        "out_of_range",
      );
    }
    if (type.maxDate && date.getTime() >= type.maxDate.getTime()) {
      throw new validators.InputError(
        `La date fourrnie doit etre avant ${type.maxDate} `,
        "out_of_range",
      );
    }
  }
  static validateEmail(str: DataType, type: StringRules) {
    if (typeof str !== "string") {
      throw new validators.InputError(
        "l' email fourni n' est pas valide",
        "invalid_email",
      );
    }
    DTO.validateString(str, type);
    validators.emailValidator(str);
  }
  static validatePassword(str: DataType, type: StringRules) {
    if (typeof str !== "string") {
      throw new validators.InputError(
        `le champ fourni doit être une chaine de caractères`,
        "not_string",
      );
    }
    DTO.validateString(str, type);
    validators.passwordValidator(str);
  }
}
