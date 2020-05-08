dist/tsc: node_modules src
	pnpx tsc

dist/index.js: dist/tsc
	pnpx ncc build --minify --source-map --no-cache dist/tsc/index.js --out dist/
