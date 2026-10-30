# blogspaces-reloaded

The source for [blog.ookamitai.com](https://blog.ookamitai.com), built with Hexo and published by GitHub Actions.

## First-time setup

```sh
npm ci
```

## Write a draft

Create a draft instead of publishing an unfinished post:

```sh
npm run draft -- "Post title"
```

Hexo creates `source/_drafts/Post-title.md`. Fill in its description, categories, and tags, then write the article below the front matter.

Preview the entire site, including drafts, in your browser:

```sh
npm run preview
```

When the draft is ready, move it into the published posts directory:

```sh
npm run ready -- "Post-title"
```

The argument is the draft filename without `.md`. To create a published post immediately, use `npm run post -- "Post title"`.

## Check and publish

Run the same clean build used by GitHub Actions:

```sh
npm run check
```

Then commit and push normally:

```sh
git add source
git commit -m "Add Post title"
git push
```

The push to `master` triggers the **Build and publish website** workflow, which will:

1. install the locked dependencies with `npm ci`;
2. build the site from a clean output directory;
3. replace the `gh-pages` branch with the generated `public/` directory.

Pull requests run the complete build check but do not publish. A deployment can also be rerun manually from the Actions tab with **Run workflow**.

GitHub Pages serves the root of the `gh-pages` branch. The custom domain is retained through `source/CNAME`.

## Paper study notes

The **论文** navigation item opens `/papers/`. The directory follows a suggested reading order in seven stages, with keyword search, topic and evidence filters, and browser-local reading progress. `/papers/guide/` explains the prerequisites and study exercises.

Notes live in `source/papers/<slug>/index.md`. Use `$...$` / `$$...$$` for LaTeX and `==important text==` for highlights. Keep independent study exercises and conjectures distinct from the paper's results. Each note states whether the original abstract or full text was checked; original excerpts and figures are preserved in a separate disclosure.

`source/_data/papers.json` contains the catalog, original-source references, and reading order. When adding a note, update the catalog, its `paper_id` front matter, and the coverage ledger in `tools/check-papers.mjs` together. The site-owned views in `layouts/` are registered by `scripts/papers.js`, so no theme submodule change is needed.

`npm run check` builds from scratch and validates source coverage, note routes, reading order, highlights, LaTeX, and internal links. CI runs the same command.
