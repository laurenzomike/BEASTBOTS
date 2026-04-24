🔒 Fix XSS vulnerabilities in OAuth callback route

🎯 What:
- Fixed a Reflected Cross-Site Scripting (XSS) vulnerability on line 106 of `server.ts` where the `error` query parameter was directly interpolated into HTML without escaping.
- Fixed a secondary XSS vulnerability on line 178 of `server.ts` where the `provider` param was directly interpolated into an inline script tag.

⚠️ Risk:
- If left unfixed, an attacker could craft a malicious OAuth callback URL containing executable JavaScript in the `error` or `provider` parameters.
- Since this route is triggered post-authentication, an attacker could potentially execute arbitrary scripts within the context of the user's browser, leading to session hijacking, token theft, or unauthorized actions on behalf of the user.

🛡️ Solution:
- Replaced the raw HTML error response with a standardized JSON response (`res.status(400).json({ error: String(error) })`), completely eliminating the HTML injection vector for the `error` parameter.
- Safely serialized and escaped the `provider` variable inside the inline `<script>` tag using `JSON.stringify(provider).replace(/</g, "\\u003c")`.
- Improved error handling in the `catch` block to securely log only the error message (preventing potential sensitive data leakage from full error objects) and standardized the 500 error response to JSON.
