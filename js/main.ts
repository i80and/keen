'use strict';

/// <reference path="lib/jquery.d.ts" />
/// <reference path="lib/dom.d.ts" />

import positionstack = module('./positionstack');
import playerwidget = module('./playerwidget');
import editorwidget = module('./editorwidget');

$(function() {
    var player = new playerwidget.Player(document.getElementById('player'));
    var editor = new editorwidget.Editor('transcriptEditor', '', player);
    
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
