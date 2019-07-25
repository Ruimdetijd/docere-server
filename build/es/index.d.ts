import { Extractor } from '../models';
export declare type Entry = {
    fileName: string;
    metadata: {
        [key: string]: string;
    };
    textdata: {
        [key: string]: string[];
    };
    text: string;
    xml: string;
    xmlDoc: XMLDocument;
};
export default function main(slug: string, splitter?: string, metadata_extractor?: string, facsimile_extractor?: string, extractors?: Extractor[]): Promise<void>;
