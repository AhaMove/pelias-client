declare const _catchAllSymbol: unique symbol;
export declare function match(...args: any[]): any;
export declare function when(props?: any): string | typeof _catchAllSymbol;
export declare namespace when {
    var __uid: number;
    var or: (...args: any[]) => string;
    var and: (...args: any[]) => string;
    var range: (start: string, end: string) => string;
    var unserialize: (serializedKey: any, value: string) => {
        match: any;
        result: string;
        position: any;
    };
}
export {};
