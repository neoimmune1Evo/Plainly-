# Plainly

Rewrites stiff or awkward text into clear writing while keeping meaning and facts. It improves clarity and flow. It cannot guarantee any AI-detector result.

## Files (keep this layout; `netlify.toml` stays in the root)
```
index.html                     the website
netlify.toml                   Netlify settings
netlify/functions/rewrite.mjs  the server code at /api/rewrite
test/rewrite.test.mjs          optional tests (node test/rewrite.test.mjs)
```

## Netlify environment variables (Site configuration > Environment variables)
| Name | Required | What it does |
|---|---|---|
| `GEMINI_API_KEY` | yes | Your Google AI Studio key. Turn on "Contains secret values". |
| `GEMINI_MODEL` | no | Default `gemini-3.8-flash`. Change it here if Google retires the model. |
| `GEMINI_THINKING_LEVEL` | no | Default `low` for Gemini 3 models (faster). Use `medium` for deeper edits or `off` to send nothing. |
| `ACCESS_CODE` | no | If set, visitors must type it in Settings. |
| `REQUEST_TIMEOUT_MS` | no | Default 9000 (Netlify's default function limit is about 10 s). |

## Deploy
1. On GitHub open your repo. Choose **Add file > Upload files**, drop in `index.html`, `netlify.toml`, the `netlify` folder and the `test` folder. Commit to `main`. (To replace a file, upload it with the same name and path.)
2. In Netlify add `GEMINI_API_KEY` as above. Variables only reach NEW deploys.
3. Netlify deploys on every commit. Then use **Deploys > Trigger deploy > Clear cache and deploy site**.
4. Test: paste a paragraph on your site and press Rewrite.

## If it fails
The page shows the reason. For details open Netlify **Logs > Functions > rewrite**. Logs hold status codes only, never your text or key. If you ever pasted the key anywhere public, create a new key and replace it.
