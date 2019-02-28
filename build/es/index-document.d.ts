import { Entry } from './index';
export declare function deleteIndex(slug: string): Promise<void>;
export declare function createIndex(slug: string, metadata: any[]): Promise<void>;
export default function indexDocument(slug: string, entry: Entry): Promise<void>;
