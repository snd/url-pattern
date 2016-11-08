interface UrlPatternOptions {
    escapeChar?: string;
    segmentNameStartChar?: string;
    segmentValueCharset?: string;
    segmentNameCharset?: string;
    optionalSegmentStartChar?: string;
    optionalSegmentEndChar?: string;
    wildcardChar?: string;
}

declare class UrlPattern {
    constructor(pattern: string, options?: UrlPatternOptions);
    constructor(pattern: RegExp, groupNames?: string[]);

    match(url: string): any;
    stringify(values?: any): string;
}

declare module UrlPattern { }

export = UrlPattern;
