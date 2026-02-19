build:
  bun run scripts/build.tsx

deploy:
  bun gh-pages -d site --nojekyll
