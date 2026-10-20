# Raval Intelligent — public shell

Public files contain only the sign-in and reading application. All article text, catalogs and private publication metadata live in vipsraval/RI_PRV_NWS_LTR. Never commit private content, test fixtures, screenshots of private articles, tokens or client secrets here.

GitHub Pages: main / root. No build or external dependencies. index.html loads app.js and site.css. Earlier reader.js/style.css may remain in history but are not used by this version.

## Access

Create a fine-grained GitHub token selecting only RI_PRV_NWS_LTR with Contents: Read-only. Enter it on the HTTPS reader on your own device. No credentials are written to URLs or logs. Remember token is off by default; opting in stores the validated token in localStorage on this browser. Unchecking it or using Forget saved token removes it. Storage is readable by scripts on the same origin, so use only a trusted personal device. This is manual token access, not OAuth. No service worker or offline cache is used. All content API requests use no-store, omit cookies, reject redirects and target a fixed GitHub API repository.

Unlock verifies the private repository and pins four JSON reads to one commit. Home, sections, search, article and archive views work within the page without navigating away and losing the session. Reload or reopening a deep link requires reauthentication. Hash URLs contain only article IDs. Article titles, body and sources are rendered through DOM text nodes, with HTTPS-only external source links and no referrer.

Lock, page departure and 60 minutes of inactivity clear private content and the in-memory token; pending requests cannot restore it. Tab switches do not lock immediately. Returning from the background checks elapsed wall-clock time. A remembered token remains saved and prefills sign-in, but never automatically opens content. Invalid tokens are removed after a 401 response. Screenshots, clipboard, browser extensions and compromised same-origin hosting are outside this protection. Protect write access to the public repository.

## Regression checks

Verify empty startup, invalid-token feedback, private-repository refusal, valid content load, all section counts, search/no-results, article/back navigation, archive/latest switching, refresh, malformed content, unsafe source rejection, lock during a pending request, reload, remembered-token opt-in/removal and background inactivity checks. Test iPad portrait and narrow phone layouts. Real valid-token verification must be performed on the user's device; never ask them to send a token in chat.
