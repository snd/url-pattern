export interface IUserInputOptions {
  escapeChar?: string;
  segmentNameStartChar?: string;
  segmentNameEndChar?: string;
  segmentValueCharset?: string;
  segmentNameCharset?: string;
  optionalSegmentStartChar?: string;
  optionalSegmentEndChar?: string;
  wildcardChar?: string;
}

export interface IOptions {
  escapeChar: string;
  segmentNameStartChar: string;
  segmentNameEndChar?: string;
  segmentValueCharset: string;
  segmentNameCharset: string;
  optionalSegmentStartChar: string;
  optionalSegmentEndChar: string;
  wildcardChar: string;
}

export const defaultOptions: IOptions = {
  escapeChar: "\\",
  optionalSegmentEndChar: ")",
  optionalSegmentStartChar: "(",
  segmentNameCharset: "a-zA-Z0-9",
  segmentNameStartChar: ":",
  segmentValueCharset: "a-zA-Z0-9-_~ %",
  wildcardChar: "*",
};
