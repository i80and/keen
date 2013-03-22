'use strict';

// Todo
// DONE 1) Make a real time-formatting function
//    - Zero-pad minutes: 1:05, not 1:5
//    - 1:60?  WTF is that?  2:00 kthxbye
// 2) Figure out the save/loading logic, and bullet-proof it
// 3) Non-hacky keybinding
// 4) Changing Player.marks should change Player.source.currentTime.  See XXX
// 5) Flash a play/pause indicator somewhere to indicate when playback has stopped
// 6) Flexible playback modes: speed, segment length
// 7) Indication when playback is out-of-range
// 8) Show playback range/progress

/**
    Player()
    Player.load(path)
    Player.remainingSegmentTime()
        Returns the number of seconds remaining in the current playback
        segment, or 0 if playback is currently halted.
    Player.play()
        Begin playback at the beginning of the current segment.
    Player.stop()
        Halt playback and cancel any associated timers.
    Player.back()
        Skip to the previous segment.
    Player.next()
        Skip to the next segment.
**/


$(function() {
    var lfill = function(fillchr, length, str) {
        var padding = [];
        for(var i = 0; i < (length - str.length); i += 1) {
            padding.push(fillchr);
        }
        
        return padding.join('') + str;
    };

    var timeFormat = function(seconds) {
        var minutes = (seconds / 60.0)|0;
        var seconds = (seconds - (minutes * 60))|0;
        return minutes.toString() + ':' + lfill('0', 2, seconds.toString());
    };

    var PositionStack = function() {
        this.marks = [];
    };

    PositionStack.prototype.isEmpty = function() {
        return this.marks.length === 0;
    };

    PositionStack.prototype.getPosition = function() {
        if(this.marks.length === 0) {
            return 0;
        }

        return this.marks[this.marks.length - 1];
    };
    
    PositionStack.prototype.pushPosition = function(pos) {
        this.marks.push(pos);
    };
    
    PositionStack.prototype.popPosition = function() {
        // Handle the empty list case
        if(this.marks.length === 0) {
            return 0;
        }

        return this.marks.pop();
    };

    PositionStack.prototype.exportPositions = function() {
        return JSON.stringify(this.marks);
    };
    
    PositionStack.prototype.importPositions = function(x) {
        this.marks = JSON.parse(x);
    };
    
    var SEGMENT_LENGTH = 6.0;
    var Player = function(element) {
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
        this.sourceElement.addEventListener('timeupdate', function() {
            this.timeElement.innerHTML = timeFormat(this.sourceElement.currentTime);
        }.bind(this));

        this.backElement.addEventListener('click', function() {
            this.back();
            this.play();
        }.bind(this));

        this.replayElement.addEventListener('click', function() {
            this.play();
        }.bind(this));

        this.nextElement.addEventListener('click', function() {
            this.play();
            this.next();
        }.bind(this));
        
        // Try to lower the playback speed, if supported
        this.speed = 1.0;
        if(this.sourceElement.playbackRate !== undefined) {
            console.log('playbackRate supported!');
            this.speed = 0.75;
        }

        this.marks = new PositionStack();
    };

    Player.prototype.load = function(path) {
        console.log(path);
        this.sourceElement.src = path;
        this.sourceElement.load();
    };

    Player.prototype.remainingSegmentTime = function() {
        if(this.playbackTimerId === 0) {
            return 0;
        }
        
        return (this.marks.getPosition() + SEGMENT_LENGTH) - this.sourceElement.currentTime;
    };
    
    Player.prototype.play = function() {
        // Keeps multiple playback timers from rolling concurrently,
        // which would make mashed potatoes out of the position stack
        this.stop();

        this.sourceElement.currentTime = this.marks.getPosition();
        this.sourceElement.play();
        this.sourceElement.playbackRate = this.speed;
        
        this.playbackTimerId = window.setTimeout(function() {
            this.sourceElement.pause();
        }.bind(this), SEGMENT_LENGTH * 1000 * (1/this.speed));
    };
    
    Player.prototype.stop = function() {
        if(this.playbackTimerId > 0) {
            window.clearTimeout(this.playbackTimerId);
            this.playbackTimerId = 0;
            this.sourceElement.pause();
        }
    };
    
    Player.prototype.back = function() {
        if(this.marks.getPosition() <= 0.0) {
            return;
        };

        this.marks.popPosition();
        this.onBack();
    };
    
    Player.prototype.next = function() {
        // If we're just starting out, start from 0
        if(this.marks.isEmpty()) {
            this.marks.pushPosition(0.0);
        }
        else {
            this.marks.pushPosition(this.marks.getPosition() + SEGMENT_LENGTH);
        }
        
        this.onNext();
    };

    var Editor = function(id, name, player) {
        this.name = name;
        this.saveInterval = 5.0;
        this.editorElement = $('#transcriptEditor')[0];    
        this.saveTimeoutId = 0;
        this.player = player;
        this.dirty = false;

        this.load(this.name);

        // Overridable callbacks
        this.onDirty = function() {};
        this.onSave = function() {};

        // We want to save whenever the document is left untouched for
        // more than saveInterval seconds.
        
        var onChange = function() {
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
            this.saveTimeoutId = window.setTimeout(function() {
                this.save(this.name);
            }.bind(this), this.saveInterval * 1000);
        }.bind(this);

        // Mark the state dirty whenever the user makes a change or moves
        // around in the stream.
        this.editorElement.addEventListener('input', function(event) {
            onChange();
        });
        this.player.onNext = this.player.onBack = function() {
            onChange();
        };
    };
    
    Editor.prototype.save = function(name) {
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
    };
    
    Editor.prototype.load = function(name) {
        this.name = name;
        
        try {
            var ctx = JSON.parse(window.localStorage.getItem(name));
            if(ctx !== null) {
                this.editorElement.value = ctx.text;
                this.player.marks.importPositions(ctx.marks);
            }
            else {
                this.editorElement.value = '';
                this.player.marks = new PositionStack();
            }
        } catch(e) {
            console.log('Error loading ' + name);
        }
    
        // XXX This is a fricking HIDEOUS violation of system boundries
        // We should have some encapsulated functionality exposed for this
        if(this.player.sourceElement.src) {
            this.player.sourceElement.currentTime = this.player.marks.getPosition();
        }
    };
    
    var player = new Player(document.getElementById('player'));
    document.addEventListener('keydown', function(event) {
        if(event.altKey && event.keyCode === 'L'.charCodeAt(0)) {
            player.next();
            player.play();
        }
    });
    document.addEventListener('keydown', function(event) {
        if(event.altKey && event.keyCode === 'K'.charCodeAt(0)) {
            player.play();
        }
    });
    document.addEventListener('keydown', function(event) {
        if(event.altKey && event.keyCode === 'J'.charCodeAt(0)) {
            player.back();
            player.play();
        }
    });
    document.addEventListener('keydown', function(event) {
        if(event.altKey && event.keyCode === 'S'.charCodeAt(0)) {
            editor.save(editor.name);
        }
    });

    var editor = new Editor('transcriptEditor', '', player);
    editor.onSave = function() {
        $('#saveStatus').animate({
            opacity: 1.0
        }, 'fast');    
    }
    editor.onDirty = function() {
        $('#saveStatus').animate({
            opacity: 0.0
        }, 'fast');
    };
    
    var objectURL = null;
    $('#fileInput')[0].onchange = function(event) {
        var file = this.files[0];
        if(objectURL !== null) {
            window.URL.revokeObjectURL(objectURL);
        }
        objectURL = window.URL.createObjectURL(file);
        player.load(objectURL);
        editor.load(file.name);
    };
});
