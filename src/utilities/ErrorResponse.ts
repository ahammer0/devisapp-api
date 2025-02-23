export default class ErrorResponse extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, ErrorResponse.prototype);
  }
}
