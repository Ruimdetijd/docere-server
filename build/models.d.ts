interface ExtractedItem {
    count: number;
    node: any;
    id: string;
}
export interface Extractor {
    color: string;
    id: string;
    items?: ExtractedItem[];
    idAttribute?: string;
    selector: string;
    title: string;
}
export declare class Project {
    description: string;
    extractors: Extractor[];
    facsimile_extractor: string;
    files: string[];
    id: string;
    metadata_extractor: string;
    slug: string;
    splitter: string;
    title: string;
    userIds: string[];
    xmlIds: string[];
}
export declare class User {
    admin: boolean;
    authenticated: boolean;
    email: string;
    id: string;
    password: string;
    projects: string[];
}
export declare class Entry {
    id: string;
    xml_id: number;
    xml: string;
    created: string;
    updated: string;
}
export {};
