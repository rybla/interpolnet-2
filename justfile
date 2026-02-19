build:
  bun run scripts/build-index.tsx

deploy:
  bun gh-pages -d site --nojekyll
