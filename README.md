# BRUGG Pipes North America: product site and configurator

Static site, published by Netlify from the `main` branch. Publish directory: `site/`. Netlify runs no build step.

## Structure

- `site/index.html`: overview of all eight products
- `site/<product>/index.html`: sub-product overview (PREMANT, CASAFLEX, CALPEX, ARMOPEX)
- `site/<product>/product.html`: full product page
- `site/configurator/`: configurator for North America (US units)
- `site/data/products.json`: data the configurator reads (generated)
- `data/products.json`: **master data** for tables and configurator (from the Technical Data Sheets; metric values govern)
- `src/`: page sources of the product pages and the overview
- `tools/build.py`: writes the pages and the configurator data from `data/` and `src/`

## Changing values

1. Edit `data/products.json`.
2. Run `python3 tools/build.py`.
3. Commit and push; Netlify publishes `site/`.

`python3 tools/serve.py` serves the site on http://127.0.0.1:8765 with the same security headers as Netlify.

## Security

- No server code, no database, no forms posted to a server, no cookies, no tracking, no third-party scripts or fonts.
- The configurator calculates in the browser. Nothing a visitor enters is stored or transmitted; the request is handed to the visitor's own mail program.
- Security headers in `netlify.toml`: Content-Security-Policy (scripts only from this site, no inline scripts, no framing, no form targets), HSTS, `X-Content-Type-Options`, `X-Frame-Options`, Referrer-Policy, Permissions-Policy.
- All scripts are separate files; pages contain no inline scripts or inline event handlers.
