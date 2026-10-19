# THE VIPUL DAILY — public reader

Only the static reader shell lives here. Never commit edition data, tasks, archives, tokens, private screenshots or secrets to this repository.

## Publish on GitHub Pages

Open Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save. Enable HTTPS. Expected URL: https://vipsraval.github.io/RI_Pub_NWS_LTR/ . Never enable Pages for the private content repository. No build, Actions workflow, external libraries or secret configuration is required.

## Manual access on iPad Safari

Create a fine-grained personal access token at https://github.com/settings/personal-access-tokens/new with a short expiry, resource owner vipsraval, only RI_PRV_NWS_LTR selected, and Contents: Read-only. Metadata read access is automatic. Do not use a classic token or grant write permission. Paste it only into the reader on your own device. Do not send it in chat. Open the edition, try the archive selector and Refresh, then Lock reader. Safari Share → Add to Home Screen is optional; this is an online reader without offline storage.

This version uses manual GitHub token authentication, not a one-click OAuth login. GitHub's documented OAuth authorization-code exchange requires a client secret. A future GitHub App sign-in would need separately configured server-side token exchange; no client secret belongs in this shell. The ChatGPT GitHub connection does not sign Safari in.

## Security boundaries

The browser sends GET requests only to the fixed api.github.com repository endpoint. Each load verifies the repository is private, resolves one commit SHA, and reads latest/archive, task state and archive index at that same revision. Tokens remain in a closure and never enter URLs, storage or logs. Inputs are cleared immediately. Fetch uses no-store, no cookies and rejects redirects. No analytics, remote fonts/images, service worker or third-party script. Article text uses textContent, and source links allow HTTPS only with no referrer. Lock, reload, page departure, backgrounding or 15 minutes without activity clear the DOM/session; pending requests cannot repopulate a locked reader. Device screenshots, clipboard, extensions and compromised same-origin hosting remain outside this protection. Protect repository write access and review shell changes before using a token. Use this origin only for trusted Pages applications.

Tasks are read-only in the reader; maintain tasks.json in the private repository. Archive views intentionally show current priorities. All edition data uses schemaVersion 1. Do not treat this initialization edition as researched news. Daily automation is intentionally not enabled.

## Manual acceptance checks

1. Open in a fresh Safari tab: no article/task data or authenticated API calls before unlock.
2. Invalid, expired or wrong-repository token: clear error; no content displayed.
3. Correct read-only token: setup edition, priorities and dated archive render.
4. Refresh and switch archive; lock during a pending load: content must stay cleared.
5. Background, reload or lock: access must be re-entered; no storage/cache entry created by app.
6. Check Safari network: content requests go directly to api.github.com; token only in Authorization header.
7. Without GitHub authentication, private repository/data endpoints return 404.

References: https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests and https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
