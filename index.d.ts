
export interface UrlPatternOptions {
    
    escapeChar?: string;
    segmentNameStartChar?: string;
    segmentValueCharset?: string;
    segmentNameCharset?: string;
    optionalSegmentStartChar?: string;
    optionalSegmentEndChar?: string;
    wildcardChar: string;
}

export interface UrlPattern {

    match(url: string): any;  
    stringify(values?: any): string;
}
    
export interface UrlPatternConstructor {
 
    (pattern: string, options?: UrlPatternOptions): UrlPattern;
    (pattern: RegExp, groupNames?: string[]): UrlPattern;
}

const UrlPattern: UrlPatternConstructor;

export = UrlPattern;
