# Raval Intelligent — public shell

Public files contain only the sign-in and reading application. All article text, catalogs and private publication metadata live in vipsraval/RI_PRV_NWS_LTR. Never commit private content, test fixtures, screenshots of private articles, tokens or client secrets here.

GitHub Pages: main / root. No build or external dependencies. index.html loads app.js and site.css. Earlier reader.js/style.css may remain in history but are not used by this version.

## Access

Create a fine-grained GitHub token selecting only RI_PRV_NWS_LTR with Contents: Read-only. Enter it on the HTTPS reader on your own device. No credentials are written to URLs, logs or browser storage. This is manual token access, not OAuth. No service worker or offline cache is used. All content API requests use no-store, omit cookies, reject redirects and target a fixed GitHub API repository.

Unlock verifies the private repository and pins four JSON reads to one commit. Home, sections, search, article and archive views work within the page without navigating away and losing the session. Reload or reopening a deep link requires reauthentication. Hash URLs contain only article IDs. Article titles, body and sources are rendered through DOM text nodes, with HTTPS-only external source links and no referrer.

Lock, page departure, backgrounding and 15 minutes of inactivity clear private content and the token; pending requests cannot restore it. Screenshots, clipboard, browser extensions and compromised same-origin hosting are outside this protection. Protect write access to the public repository.

## Regression checks

Verify empty startup, invalid-token feedback, private-repository refusal, valid content load, all section counts, search/no-results, article/back navigation, archive/latest switching, refresh, malformed content, unsafe source rejection, lock during a pending request, reload and background cleanup. Test iPad portrait and narrow phone layouts. Real valid-token verification must be performed on the user's device; never ask them to send a token in chat.
