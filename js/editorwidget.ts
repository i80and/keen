/// <reference path="lib/jquery.d.ts" />
/// <reference path="lib/dom.d.ts" />

import positionstack = module('./positionstack');
import playerwidget = module('./playerwidget');

export class Editor {
    name: string;
    saveInterval: number;
    editorElement: HTMLInputElement;
    saveTimeoutId: number;
    player: playerwidget.Player;
    dirty: bool;

    audioURL: any;
    
    onDirty: () => void;
    onSave: () => void;

    constructor(id: string, name: string, player: playerwidget.Player) {
        this.name = name;
        this.saveInterval = 5.0;
        this.editorElement = $('#transcriptEditor')[0];    
        this.saveTimeoutId = 0;
        this.player = player;
        this.dirty = false;
        this.audioURL = null;
    
        this.load(this.name);
    
        // Overridable callbacks
        this.onDirty = function() {};
        this.onSave = function() {};
    
        // We want to save whenever the document is left untouched for
        // more than saveInterval seconds.
        var onChange = () => {
            // Only trigger the onDirty callback once
            if(this.dirty === false) {
                this.onDirty();
                this.dirty = true;
            }
            
            // Reset the timer if the user makes a change
            if(this.saveTimeoutId > 0) {
                window.clearTimeout(this.saveTimeoutId);
            }
            
            // Set a new timeout
            this.saveTimeoutId = window.setTimeout(() => {
                this.save(this.name);
            }, this.saveInterval * 1000);
        };
    
        // Mark the state dirty whenever the user makes a change or moves
        // around in the stream.
        this.editorElement.addEventListener('input', () => {
            onChange();
        });
        this.player.onNext = this.player.onBack = () => {
            onChange();
        };
    }

    save(name: string) {
        var ctx = {
            'text': this.editorElement.value,
            'marks': this.player.marks.exportPositions()
        };
        window.localStorage.setItem(name, JSON.stringify(ctx));
        this.dirty = false;
        this.onSave();

        // Cancel any existing timeouts if necessary
        if(this.saveTimeoutId > 0) {
            window.clearTimeout(this.saveTimeoutId);
            this.saveTimeoutId = 0;
        }
    }
    
    load(name: string) {
        this.name = name;
        
        try {
            var ctx = JSON.parse(window.localStorage.getItem(name));
            if(ctx !== null) {
                this.editorElement.value = ctx.text;
                this.player.marks.importPositions(ctx.marks);
            }
            else {
                this.editorElement.value = '';
                this.player.marks = new positionstack.PositionStack();
            }
        } catch(e) {
            console.log('Error loading ' + name);
        }
    
        // XXX This is a fricking HIDEOUS violation of system boundries
        // We should have some encapsulated functionality exposed for this
        if(this.player.sourceElement.src) {
            this.player.sourceElement.currentTime = this.player.marks.getPosition();
        }
    }
    
    registerInputElement(element: HTMLInputElement) {
        var load = (file: any) => {
            var file = element.files[0];
            if(this.audioURL !== null) {
                window.URL.revokeObjectURL(this.audioURL);
            }
            this.audioURL = window.URL.createObjectURL(file);
            this.player.load(this.audioURL);
            this.load(file.name);
        }

        var tryLoad = () => {
            if(element.files.length > 0) {
                load(element.files[0]);
            }
        };
        
        tryLoad();
        element.onchange = tryLoad;
    }
}
