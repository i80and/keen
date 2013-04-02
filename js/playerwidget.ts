/// <reference path="lib/jquery.d.ts" />
/// <reference path="lib/dom.d.ts" />

import positionstack = module('./positionstack');

function lfill(fillchr: string, length: number, str: string) {
    var padding = [];
    for(var i = 0; i < (length - str.length); i += 1) {
        padding.push(fillchr);
    }

    return padding.join('') + str;
}

function timeFormat(seconds: number) {
    var minutes = (seconds / 60.0)|0;
    var seconds = (seconds - (minutes * 60))|0;
    return minutes.toString() + ':' + lfill('0', 2, seconds.toString());
}

var SEGMENT_LENGTH = 6;
export class Player {
    sourceElement: any;
    backElement: any;
    replayElement: any;
    nextElement: any;
    timeElement: any;

    marks: positionstack.PositionStack;
    playbackTimerId: number;
    speed: number;
    
    onNext: () => void;
    onBack: () => void;

    constructor(element: Element) {
        this.sourceElement = document.createElement('audio');
        this.backElement = $('<button>Back</button>')[0];
        this.replayElement = $('<button>Replay</button>')[0];
        this.nextElement = $('<button>Next</button>')[0];
        this.timeElement = document.createElement('div');
        
        element.appendChild(this.sourceElement);
        element.appendChild(this.backElement);
        element.appendChild(this.replayElement);
        element.appendChild(this.nextElement);
        element.appendChild(this.timeElement);
        
        this.playbackTimerId = 0;

        // Event callbacks
        // When changing the current mark position, we typically want to take
        // some action elsewhere, like saving the current mark stack.
        this.onNext = function() {};
        this.onBack = function() {};

        // Regularly update our time string (x:xx)
        this.sourceElement.addEventListener('timeupdate', () => {
            this.timeElement.innerHTML = timeFormat(this.sourceElement.currentTime);
        });

        this.backElement.addEventListener('click', () => {
            this.back();
            this.play();
        });

        this.replayElement.addEventListener('click', () => {
            this.play();
        });

        this.nextElement.addEventListener('click', () => {
            this.play();
            this.next();
        });
        
        // Try to lower the playback speed, if supported
        this.speed = 1.0;
        if(this.sourceElement.playbackRate !== undefined) {
            console.log('playbackRate supported!');
            this.speed = 0.75;
        }

        this.marks = new positionstack.PositionStack();
    }

    load(path: string) {
        this.sourceElement.src = path;
        this.sourceElement.load();
    }
    
    remainingSegmentTime() {
        if(this.playbackTimerId === 0) {
            return 0;
        }
        
        return (this.marks.getPosition() + SEGMENT_LENGTH) - this.sourceElement.currentTime;
    }
    
    play() {
        // Keeps multiple playback timers from rolling concurrently,
        // which would make mashed potatoes out of the position stack
        this.stop();

        this.sourceElement.currentTime = this.marks.getPosition();
        this.sourceElement.play();
        this.sourceElement.playbackRate = this.speed;
        
        this.playbackTimerId = window.setTimeout(() => {
            this.sourceElement.pause();
        }, SEGMENT_LENGTH * 1000 * (1/this.speed));
    }

    stop() {
        if(this.playbackTimerId > 0) {
            window.clearTimeout(this.playbackTimerId);
            this.playbackTimerId = 0;
            this.sourceElement.pause();
        }
    }

    back() {
        if(this.marks.getPosition() <= 0.0) {
            return;
        };

        this.marks.popPosition();
        this.onBack();
    }

    next() {
        // If we're just starting out, start from 0
        if(this.marks.isEmpty()) {
            this.marks.pushPosition(0.0);
        }
        else {
            this.marks.pushPosition(this.marks.getPosition() + SEGMENT_LENGTH);
        }
        
        this.onNext();
    }
}
