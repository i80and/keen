declare var JSON: {
    parse(x: string): any;
    stringify(any): any;
}

declare var console: {
    log(any): void;
}

 interface DOMStorage {
    getItem(key: string): any;
    setItem(key: string, value: any): void;
}

declare var document: {
    addEventListener(name: string, any): void;
    createElement(type: string): Element;
    getElementById(id: string): Element;
}

interface Element {
    addEventListener(name: string, any): void;
    appendChild(x: Element);
}

interface HTMLInputElement {
    addEventListener(name: string, any): void;
    value: string;
    appendChild(x: Element);
    files: any[];

    onchange: (f: any) => void;
}

interface URL {
    revokeObjectURL: (any) => any;
    createObjectURL: (any) => any;
}

declare var window: {
    URL: URL;
    localStorage: DOMStorage;
    sessionStorage: DOMStorage;
    setTimeout(any, length: number): number;
    clearTimeout(id: number);
}
