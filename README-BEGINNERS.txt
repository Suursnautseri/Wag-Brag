Wag & Brag — ALL-IN-ONE (Beginner)

Files you care about:
- index.html — the web page
- app.jsx — the program
- connectors.json — connector styles; change width/height/textX/textY here
- connectors/*.svg — your connector images (Hearts & Paws, Hearts, Rosette Awards)
- breed_options.json — breeds + ear/tail options (starter version)
- silhouettes.json — custom dog outlines (leave {} to use built-in fallback)
- titles_akc.json / titles_ukc.json — title data (build these with titles_importer.html)
- titles_importer.html — open this file and follow the steps to build full title lists

Super basic steps to publish on GitHub Pages:
1) Create a GitHub repository (Public). Name example: wag-and-brag.
2) Click “Add file → Upload files”, then upload EVERYTHING from this zip (keep folders).
3) Commit.
4) Turn on Pages: Repo → Settings → Pages → Source: “Deploy from a branch”, Branch: main / root → Save.
5) Open your site: https://YOUR-USERNAME.github.io/YOUR-REPO
6) Hard refresh (Ctrl+F5).

Add the full AKC & UKC titles:
1) Double-click titles_importer.html to open it in your browser.
2) As instructed on that page, copy all text from the two official pages, paste, and click “Build JSON”.
3) It gives you two downloads: titles_akc.json and titles_ukc.json.
4) Upload them to your repo (replace the placeholder files) → Commit → Hard refresh.
