# blogspaces-reloaded

The source for [blog.ookamitai.com](https://blog.ookamitai.com), built with Hexo and published by GitHub Actions.

## Write and preview

```sh
npm ci
npm run new -- post "Post title"
npm run preview
```

Drafts are visible in the local preview. Before pushing, run the same clean build used by CI:

```sh
npm run check
```

## Publish

Push changes to `master`. The **Build and publish website** workflow will:

1. install the locked dependencies with `npm ci`;
2. build the site from a clean output directory;
3. replace the `deploy` branch with the generated `public/` directory.

Pull requests run the complete build check but do not publish. A deployment can also be rerun manually from the Actions tab with **Run workflow**.

GitHub Pages should be configured to serve the root of the `deploy` branch. The custom domain is retained through `source/CNAME`.
