export function isString(value: any): value is string {
  return Object.prototype.toString.call(value) === '[object String]';
}

export function isObject(value: any): value is {} {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function isBoolean(value: any): value is boolean {
  return Object.prototype.toString.call(value) === '[object Boolean]';
}
