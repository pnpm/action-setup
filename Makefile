node_modules: package.json
	pnpm install --prefer-offline

dist/tsc:	node_modules src
	pnpx tsc

dist/index.js: dist/tsc
	pnpx ncc build --minify --source-map dist/tsc/index.js --out dist/
