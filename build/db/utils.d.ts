import { QueryResult } from 'pg';
export declare function isAdmin(email: string, password: string, shouldBeAdmin?: boolean): Promise<any>;
export declare function hasRows(result: QueryResult): number;
export declare const selectByProp: (table: string, field: string, value: string, fields?: string[]) => Promise<any>;
export declare const selectOne: (table: string, field: string, value: string, fields?: string[]) => Promise<any>;
export declare const execSql: (sql: string, values?: (string | number)[]) => Promise<QueryResult>;
