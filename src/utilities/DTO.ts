import "reflect-metadata";

type ErrorType =
  | "invalid_email"
  | "insecure_password"
  | "not_string"
  | "not_number"
  | "not_boolean"
  | "not_date_object"
  | "not_date_string"
  | "not_array"
  | "not_object"
  | "wrong_type"
  | "out_of_range"
  | "missing_key"
  | "unknown_type"
  | "too_much_keys";

export class InputError extends Error {
  errorType = "InputError";
  type?: ErrorType;
  constructor(message: string, type?: ErrorType) {
    super(message);
    this.type = type;
    Object.setPrototypeOf(this, InputError.prototype);
  }
}

export enum Type {
  String = "string",
  Email = "email",
  Password = "password",
  Boolean = "boolean",
  Date = "date",
  Number = "number",
  Object = "object",
  Array = "array",
  Enum = "enum",
}
/////////////////////////////////////////////////////////////////////
//                                                                 //
//            Rules                                                //
//                                                                 //
/////////////////////////////////////////////////////////////////////

//props for all rules
type OptionalRules = { optional: true } | { optional?: false | undefined };
type NullableRules = { nullable: true } | { nullable?: false | undefined };

//have to be one of theses
interface BaseStringRules {
  minLength?: number;
  maxLength?: number;
}
interface StringRules extends BaseStringRules {
  type: Type.String | Type.Email | Type.Password;
}

interface BaseBooleanRules {
  type: Type.Boolean;
}
interface BooleanRules extends BaseBooleanRules {} //eslint-disable-line

interface BaseNumberRules {
  float?: boolean;
  min?: number;
  max?: number;
}
interface NumberRules extends BaseNumberRules {
  type: Type.Number;
}

interface BaseDateRules {
  minDate?: Date;
  maxDate?: Date;
}
interface DateRules extends BaseDateRules {
  type: Type.Date;
}

interface BaseObjectRules {
  element: new (data: object) => Schema | { [key: string]: RulesType };
}
interface ObjectRules extends BaseObjectRules {
  type: Type.Object;
}
interface BaseArrayRules {
  element: RulesType;
  minLength?: number;
  maxLength?: number;
}
interface ArrayRules extends BaseArrayRules {
  type: Type.Array;
}
interface BaseEnumRules {
  values: Array<unknown>;
}
interface EnumRules extends BaseEnumRules {
  type: Type.Enum;
}

export type RulesType = OptionalRules &
  NullableRules &
  (
    | StringRules
    | BooleanRules
    | NumberRules
    | DateRules
    | ObjectRules
    | ArrayRules
    | EnumRules
  );

type getArrayRulesType<T extends ArrayRules> = getBaseTypeFromRule<
  T["element"]
>[];

//prettier-ignore
type getBaseTypeFromRule<T extends RulesType> = 
  T extends StringRules ? string :
  T extends BooleanRules ? boolean :
  T extends NumberRules ? number :
  T extends DateRules ? Date :
  T extends ArrayRules ? getArrayRulesType<T>:
  T extends EnumRules ? T["values"][number] :
  T extends ObjectRules ? object : never
;
type handleOptional<T extends RulesType> = T extends { optional: true }
  ? undefined | getBaseTypeFromRule<T>
  : getBaseTypeFromRule<T>;
/////////////////////////////////////////////////////////////////////
//                                                                 //
//            getTypeFromRule                                      //
//                                                                 //
/////////////////////////////////////////////////////////////////////

type getTypeFromRule<T extends RulesType> = T extends { nullable: true }
  ? null | handleOptional<T>
  : handleOptional<T>;

/////////////////////////////////////////////////////////////////////
//                                                                 //
//            Schema type generation                               //
//                                                                 //
/////////////////////////////////////////////////////////////////////

type SchemaType = Record<string | symbol | number, RulesType>;

export type getTypeFromSchema<T extends SchemaType> = {
  [K in keyof T]: getTypeFromRule<T[K]>;
};

///////////////////////////////////////

// TODO:Trouble Implement this
// interface Options {
//   enforceKeys?: boolean;
// }

export default class DTO {
  protected static parseElement(el: unknown, rules: RulesType, key: string) {
    if (el === undefined && rules.optional) return el as undefined;

    if (el === undefined) {
      throw new InputError(`-->Key: '${key}' is missing`, "missing_key");
    }
    if (el === null && rules.nullable) return el as null;
    if (el === null) {
      throw new InputError(`-->Key: '${key}' can't be null`, "missing_key");
    }

    try {
      switch (rules.type) {
        case Type.Email:
          return DTO.validateEmail(el, rules);
        case Type.String:
          return DTO.validateString(el, rules);
        case Type.Number:
          return DTO.validateNumber(el, rules);
        case Type.Password:
          return DTO.validatePassword(el, rules);
        case Type.Boolean:
          return DTO.validateBoolean(el);
        case Type.Date:
          return DTO.validateDate(el, rules);
        case Type.Enum:
          return DTO.validateEnum(el, rules);
        case Type.Array:
          return DTO.parseArray(el, rules);
        case Type.Object:
          return DTO.parseObject(el, rules);
        default:
          throw new InputError(`-->Un handled type`, "unknown_type");
      }
    } catch (e) {
      if (e instanceof InputError) {
        throw new InputError(`.${key}${e.message}`, e.type);
      }
      throw e;
    }
  }

  static parseObject(obj: unknown, rule: BaseObjectRules) {
    DTO.assertObject(obj);
    if (DTO.isFunction(rule.element)) {
      return new rule.element(obj);
    }
    const keyRules = Object.entries(rule.element);
    for (const [key, rule] of keyRules) {
      try {
        obj[key] = DTO.parseElement(obj[key], rule, key);
      } catch (e) {
        if (e instanceof InputError) {
          throw new InputError(`.${e.message}`, e.type);
        }
        throw e;
      }
    }
    return obj;
  }
  static parseArray(arr: unknown, rule: BaseArrayRules) {
    if (!(arr instanceof Array)) {
      throw new InputError(`-->expecting array, given ${arr}`, "not_array");
    }
    if (rule.minLength && arr.length < rule.minLength) {
      throw new InputError(
        `-->array should be at least ${rule.minLength} elements long, given length: ${arr.length}`,
        "out_of_range",
      );
    }
    if (rule.maxLength && arr.length > rule.maxLength) {
      throw new InputError(
        `-->array should be less than ${rule.maxLength} elements long, given length: ${arr.length}`,
        "out_of_range",
      );
    }

    const retArr = arr.map((el: unknown, id) => {
      try {
        const ell: unknown = DTO.parseElement(el, rule.element, ``);
        return ell;
      } catch (e) {
        if (e instanceof InputError) {
          throw new InputError(`.[${id}]${e.message}`, e.type);
        }
        throw e;
      }
    });

    return retArr;
  }

  static validateEnum(en: unknown, type: BaseEnumRules) {
    if (!type.values.includes(en)) {
      throw new InputError(
        `-->value not in enum: ${type.values.join()}, given:${en}`,
        "out_of_range",
      );
    }
    return en;
  }
  static validateString(str: unknown, type?: BaseStringRules) {
    if (typeof str === "number") return str.toString();
    if (typeof str !== "string") {
      throw new InputError(`-->not string, given: ${str}`, "not_string");
    }
    if (type?.minLength && str.length < type.minLength) {
      throw new InputError(
        `-->Should be longer than ${type.minLength} chars, given length: ${str.length}`,
        "out_of_range",
      );
    }
    if (type?.maxLength && str.length > type.maxLength) {
      throw new InputError(
        `-->Should be shorter than ${type.maxLength} chars, given length: ${str.length}`,
        "out_of_range",
      );
    }
    return str;
  }

  static validateNumber(num: unknown, type?: BaseNumberRules) {
    if (typeof num === "string") {
      if (type?.float) {
        const withoutComma = num.replace(",", ".") as string;
        num = parseFloat(withoutComma);
      } else {
        num = parseInt(num);
      }
    }
    if (typeof num !== "number" || isNaN(num)) {
      throw new InputError(`-->Should be number, given: ${num}`, "not_number");
    }
    if (type?.min && num < type.min) {
      throw new InputError(
        `-->Number should be more than ${type.min}, given: ${num}`,
        "out_of_range",
      );
    }
    if (type?.max && num > type.max) {
      throw new InputError(
        `-->Number should be less than ${type.min}, given: ${num}`,
        "out_of_range",
      );
    }
    return num;
  }

  static validateBoolean(bool: unknown) {
    if (typeof bool !== "boolean") {
      throw new InputError(
        `-->Should de boolean, given: ${bool}`,
        "not_boolean",
      );
    }
    return bool;
  }

  static validateDate(date: unknown, type?: BaseDateRules) {
    // string parsable : 1995-12-17T03:24:00
    if (typeof date === "string") {
      const splited = date.split("T");
      let dateToParse = date;
      if (splited.length === 1) {
        dateToParse = `${splited[0]}T00:00:00`;
      }

      const test = new Date(dateToParse);
      if (test.toString() === "Invalid Date") {
        throw new InputError(
          `-->Failed to parse date, given:${date}.
          Should be ISO string in format YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD`,
          "not_date_string",
        );
      }
      date = test;
    }

    if (!(date instanceof Date)) {
      throw new InputError(`-->Should be Date object`, "not_date_object");
    }
    if (type?.minDate && date.getTime() < type.minDate.getTime()) {
      throw new InputError(
        `-->Date sould be after ${type.minDate}, given:${date}`,
        "out_of_range",
      );
    }
    if (type?.maxDate && date.getTime() > type.maxDate.getTime()) {
      throw new InputError(
        `-->Date should be before ${type.maxDate}, given:${date} `,
        "out_of_range",
      );
    }
    return date;
  }

  static validateEmail(str: unknown, type?: BaseStringRules) {
    if (typeof str !== "string") {
      throw new InputError("-->Email should be string type", "invalid_email");
    }
    DTO.validateString(str, type);
    const re = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/gm; //eslint-disable-line
    if (!re.test(str)) {
      throw new InputError("-->Invalid email format", "invalid_email");
    }
    return str;
  }

  static validatePassword(str: unknown, type?: BaseStringRules) {
    if (typeof str !== "string") {
      throw new InputError(`-->Password should be string type`, "not_string");
    }
    const re = /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "\.,]).*$/gm; //eslint-disable-line
    if (!re.test(str)) {
      throw new InputError(
        `-->Password should be at least 8 chars long and contain at least one number,
                  one letter and one special character. Ex:'Test1234!'`,
        "insecure_password",
      );
    }
    DTO.validateString(str, type);
    return str;
  }

  /// guard functions
  private static isObject(value: unknown) {
    return typeof value === "object" && value !== null;
  }
  private static isFunction(
    fn: unknown,
  ): fn is (...args: unknown[]) => unknown {
    return typeof fn === "function";
  }

  // assertion functions
  private static assertObject(
    el: unknown,
  ): asserts el is { [key: string]: unknown } {
    if (!DTO.isObject(el)) {
      throw new InputError(`-->should be an object`, "not_object");
    }
  }

  //TODO://Schema manipulation
  // -merge(schema1, schema2)
  // -partial(schema)
  // -omit(schema, keys)
  //
  //static extend(sch1: SchemaType, sch2: SchemaType) {
  //  return { ...sch1, ...sch2 };
  //}
  //static partial(sch: SchemaType) {
  //  const newSch: SchemaType = JSON.parse(JSON.stringify(sch));
  //  Object.keys(sch).forEach((key: keyof typeof newSch) => {
  //    newSch[key] = sch[key];
  //    newSch[key].optional = true;
  //  });
  //  return newSch;
  //}
  //static omit(sch: SchemaType, keys: (keyof SchemaType)[]) {
  //  const newSch: SchemaType = JSON.parse(JSON.stringify(sch));
  //  Object.keys(sch).forEach((key: keyof typeof newSch) => {
  //    if (keys.includes(key)) delete newSch[key];
  //    newSch[key] = sch[key];
  //  });
  //  return newSch;
  //}
}
// TODO: whipe base type to enforce keys
// maybe look in class metadata for manipulation
const METADATA_KEY = Symbol("rules");

type AnyConstructor<T> = new (...args: any[]) => T; //eslint-disable-line
type AnyObject = { [key: string]: any }; //eslint-disable-line

export function rule(rule: RulesType) {
  //errors on any for target
  //eslint-disable-next-line
  return function (target: any, propertyKey: string) {
    //target is the class itself ie the prototype
    const rules = Reflect.getOwnMetadata(METADATA_KEY, target) ?? new Map();

    rules.set(propertyKey, rule);
    Reflect.defineMetadata(METADATA_KEY, rules, target);
  };
}

export abstract class Schema extends DTO {
  [key: string]: unknown;
  constructor(data: object) {
    super();
    //affectation de tous les éléments passés au constructeur
    this.parse(data);
    //remove undefined keys
    const removeEmpty = (obj: AnyObject) => {
      const newObj: AnyObject = {};
      Object.keys(obj).forEach((key) => {
        if (obj[key] === Object(obj[key])) removeEmpty(obj[key]);
        else if (obj[key] === undefined) delete obj[key];
      });
      return newObj;
    };
    removeEmpty(this);
  }
  private parse(data: object) {
    const target = Object.getPrototypeOf(this);
    const inputEntries = Object.entries(data);
    const rules = Reflect.getOwnMetadata(METADATA_KEY, target);

    if (!rules)
      throw new Error("No rules found, you have to use the rule decorator");

    //trim excess data
    for (const [key, value] of inputEntries) {
      if (rules.has(key)) {
        this[key] = value;
      }
    }
    //validating data
    rules.forEach((rule: RulesType, key: string) => {
      try {
        this[key] = Schema.parseElement(this[key], rule, key);
        //validating data
      } catch (e) {
        if (e instanceof InputError) {
          throw new InputError(`{}${e.message}`, e.type);
        } else {
          throw e;
        }
      }
    });
  }

  /**
   * @description make all parameters optional
   */
  static partial<T extends Schema>(schema: AnyConstructor<T>) {
    class PartialSchema extends schema {}
    const rules =
      Reflect.getMetadata(METADATA_KEY, PartialSchema.prototype) ?? [];
    const newRules = new Map();
    rules.forEach((rule: RulesType, key: string) => {
      newRules.set(key, { ...rule, optional: true });
    });

    Reflect.defineMetadata(METADATA_KEY, newRules, PartialSchema.prototype);
    return PartialSchema as AnyConstructor<Partial<T>>;
  }

  // /**
  //  * @description Merge two schemas,second schema takes precedence
  //  */
  // static merge<T extends Schema, K extends Schema>(
  //   schema1: AnyConstructor<T>,
  //   schema2: AnyConstructor<K>,
  // ) {
  //   class MergedSchema extends schema2 {}
  //
  //   //merging rules FIX:
  //   const rules1 =
  //     Reflect.getMetadata(METADATA_KEY, schema1.prototype) ?? new Map();
  //   const rules2 =
  //     Reflect.getMetadata(METADATA_KEY, schema2.prototype) ?? new Map();
  //   const newRules = new Map(rules1);
  //   rules2.forEach((rule: RulesType, key: string) => {
  //     newRules.set(key, rule);
  //   });
  //   console.log("rules1:", newRules);
  //   Reflect.defineMetadata(METADATA_KEY, newRules, MergedSchema.prototype);
  //   const proto = Object.getPrototypeOf(schema2);
  //
  //   const ret = { ...schema1, ...schema2, __proto__: proto };
  //   return ret;
  // }
  // //TODO: omit
  // //FIX:
  // static omit<K extends string>(
  //   schema: AnyConstructor<Schema>,
  //   omitKeys: string[],
  // ) {
  //   class OutputSchema extends schema {}
  //   const rules1 =
  //     Reflect.getMetadata(METADATA_KEY, schema.prototype) ?? new Map();
  //   const newRules = new Map();
  //   rules1.forEach((rule: RulesType, key: string) => {
  //     if (omitKeys.includes(key)) return;
  //     newRules.set(key, rule);
  //   });
  //   console.log("rules1:", newRules);
  //   Reflect.defineMetadata(METADATA_KEY, newRules, OutputSchema.prototype);
  //
  //   return OutputSchema;
  //   // return OutputSchema as AnyConstructor<OptionalKey<Schema, K>>;
  //   // return OutputSchema as AnyConstructor<Omit<OutputSchema, K>>;
  //   // return (data: object) => {
  //   //   return {
  //   //     ...schema,
  //   //     constructor: (data: object) => new OutputSchema(data),
  //   //     __proto__: schema.prototype,
  //   //   };
  //   // };
  // }
  // //TODO: static union<T extends Schema>(...schemas: AnyConstructor<T>[]) {
  // //   return schemas.reduce(
  // //     (acc, schema) => DTO.merge(acc, schema.prototype),
  // //     {} as AnyConstructor<Schema>,
  // //   );
  // // }
}
// class te extends Schema {
//   @rule({ type: Type.String })
//   name!: number;
//   @rule({ type: Type.Number })
//   namebite!: number;
// }
// const data = {
//   name: "beub",
//   namebite: 3,
//   bite: "pas ici",
// };
// const partial = Schema.partial(te);
// const val = new partial(data);
// console.log("\n---log de val---");
// console.log(val);
