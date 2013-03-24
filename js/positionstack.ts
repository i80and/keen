/// <reference path="dom.d.ts" />

export class PositionStack {
    marks: number[];

    constructor() {
        this.marks = [];
    }
    
    isEmpty() {
        return this.marks.length === 0;
    }
    
    getPosition() {
        if(this.marks.length === 0) {
            return 0;
        }

        return this.marks[this.marks.length - 1];
    }
    
    pushPosition(pos: number) {
        this.marks.push(pos);
    }
    
    popPosition() {
        // Handle the empty list case
        if(this.marks.length === 0) {
            return 0;
        }

        return this.marks.pop();
    }
    
    exportPositions() {
        return JSON.stringify(this.marks);
    }
    
    importPositions(x: string) {
        this.marks = JSON.parse(x);
    }
}
