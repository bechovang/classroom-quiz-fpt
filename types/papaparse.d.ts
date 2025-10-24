declare module "papaparse" {
  export interface ParseResult<T> {
    data: T[]
    errors: any[]
    meta: any
  }
  export function parse<T = any>(input: string, config?: { header?: boolean; skipEmptyLines?: boolean }): ParseResult<T>
  export function unparse(input: any): string
  const _default: { parse: typeof parse; unparse: typeof unparse }
  export default _default
}
