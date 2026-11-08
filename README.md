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
