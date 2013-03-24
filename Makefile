.PHONY: clean deps

TSC=./node_modules/.bin/tsc
BROWSERIFY=./node_modules/.bin/browserify
UGLIFY=./node_modules/.bin/uglifyjs

OUTPUT=js/keen.js

FILES=\
    js/main.ts \
    js/playerwidget.ts \
    js/editorwidget.ts \
    js/positionstack.ts \
    js/lib/dom.d.ts \
    js/lib/jquery.d.ts

$(OUTPUT): $(FILES)
	$(TSC) --nolib js/main.ts
	$(BROWSERIFY) js/main.js -o $(OUTPUT)

clean:
	rm -f $(FILES:.ts=.js)
	rm -f $(OUTPUT)

deps:
	npm install
	npm prune
