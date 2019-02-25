import { Extractor } from '../models';
export declare type DocData = [{
    [key: string]: string;
}, {
    [key: string]: string[];
}, string];
export default function main(slug: string, metadata_extractor: string, extractors: Extractor[]): Promise<void>;
