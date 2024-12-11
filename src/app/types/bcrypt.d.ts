// src/types/bcrypt.d.ts
declare module 'bcrypt' {
  export function hash(data: string | Buffer, salt: number | string): Promise<string>;
  export function hashSync(data: string | Buffer, salt: number | string): string;
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  export function compareSync(data: string | Buffer, encrypted: string): boolean;
  export function genSalt(rounds?: number): Promise<string>;
  export function genSaltSync(rounds?: number): string;
}
