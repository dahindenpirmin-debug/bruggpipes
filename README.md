# BRUGG Pipes North America: product site, configurator and Academy

Static site, published by Netlify from the `main` branch. Netlify runs `python3 tools/build.py` and publishes `site/`.

## Structure

- `site/index.html`: overview of all product groups
- `site/<group>/index.html`: landing page of the product group (hand-built for PREMANT, CASAFLEX, CALPEX, ARMOPEX; generated for groups created in the admin area)
- `site/configurator/`: configurator for North America (US units)
- `site/academy/`: Academy with online courses
- `site/admin/`: content manager (Decap CMS 3.18, self-hosted, MIT license)
- `site/uploads/`: files uploaded in the content manager
- `data/groups/*.json`: one file per product group (card, key figures, videos, documents)
- `data/academy/*.json`: one file per course
- `data/products.json`: range tables and configurator data (from the Technical Data Sheets; metric values govern)
- `src/`: page sources of the hand-built pages
- `tools/build.py`, `tools/cms.py`, `tools/configurator.py`: write all pages from `data/` and `src/`

## Editing content

Open `/admin/` on the live site and log in with a GitHub account that has write access to this repository.

- **Product groups**: change card texts, key figures, videos, data sheets and documents; replace a file by uploading the new one in the same entry. A new group gets its own page when its status is "live".
- **Academy courses**: change modules and documents, add courses.

Every save is a commit to `main`; Netlify rebuilds and publishes within about a minute. Range tables and configurator values are changed in `data/products.json`.

### One-time setup of the login

1. GitHub: Settings > Developer settings > OAuth Apps > New OAuth App. Homepage URL: the site address. Authorization callback URL: `https://api.netlify.com/auth/done`.
2. Netlify: project `bruggpipes-us` > Project configuration > Access & security > OAuth > Install provider > GitHub, with the Client ID and Client secret of that OAuth App.

Only accounts with write access to the repository can save. The client secret is stored at Netlify only, never in this repository.

## Local

`python3 tools/build.py` builds; `python3 tools/serve.py` serves on http://127.0.0.1:8765 with the same headers as Netlify.

## Security

- No server code, no database, no forms posted to a server, no cookies, no tracking, no third-party scripts or fonts.
- The configurator calculates in the browser. Nothing a visitor enters is stored or transmitted.
- Every public page carries a strict Content-Security-Policy (scripts only from this site, no inline scripts). The admin area has its own policy, limited to GitHub and Netlify for login and saving.
- Headers in `netlify.toml`: HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy.
- Text from the data files is escaped when pages are built.
- The admin area changes nothing without a GitHub login with write access; all changes are visible and reversible in the commit history.
