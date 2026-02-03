# Privacy Policy for GitHub PR Live View

**Last Updated:** February 3, 2026

## Overview

GitHub PR Live View ("the Extension") is a browser extension that helps you track your GitHub pull requests. We are committed to protecting your privacy and being transparent about our data practices.

**In short:** We only access what's necessary to show your PRs. Your data stays in your browser. We don't track you, sell your data, or store anything on our servers.

---

## Data We Access

### GitHub Account Information
When you sign in, we access:
- Your GitHub username and display name
- Your profile picture URL
- Your open pull requests (title, repository, status, labels)
- CI/CD check status for your PRs

**Why:** This is the core functionality of the extension — displaying your pull requests.

### OAuth Access Token
We receive an access token from GitHub after you authorize the extension.

**Why:** Required to make API requests to GitHub on your behalf.

---

## Data Storage

### What's Stored Locally
All data is stored locally in your browser using Chrome's storage API:
- GitHub OAuth access tokens
- Your GitHub user profile (username, avatar URL)
- Cached pull request data
- Your preferences (enabled categories, refresh interval)

### What's NOT Stored
- Your repository code or contents
- Your commit history
- Your private messages or comments
- Any data on external servers (except as noted below)

---

## Third-Party Services

### GitHub
We use GitHub's OAuth and API services. When you use this extension, you're also subject to [GitHub's Privacy Policy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

### Cloudflare Workers
We use a Cloudflare Worker solely to exchange OAuth authorization codes for access tokens. This is required because GitHub's OAuth flow requires a client secret that cannot be safely stored in a browser extension.

**The Cloudflare Worker:**
- Receives the temporary authorization code
- Exchanges it with GitHub for an access token
- Returns the token to your browser
- Does NOT log or store any data
- Does NOT have access to your GitHub data

---

## Data We Do NOT Collect

- ❌ Personal information beyond your GitHub profile
- ❌ Browsing history
- ❌ Analytics or usage tracking
- ❌ Advertising identifiers
- ❌ Location data
- ❌ Data from other tabs or websites

---

## Data Sharing

**We do not sell, trade, or transfer your data to third parties.**

Your GitHub access token is only sent to:
1. GitHub's API (to fetch your PRs)
2. Our Cloudflare Worker (one-time, during sign-in only)

---

## Data Security

- Access tokens are stored locally in Chrome's secure storage
- All communication uses HTTPS encryption
- We request minimal GitHub permissions needed for functionality
- OAuth state verification prevents CSRF attacks

---

## Your Rights & Controls

### You Can:
- **Sign out** anytime to remove your stored tokens
- **Switch accounts** or add multiple accounts
- **Uninstall** the extension to remove all locally stored data

### To Delete Your Data:
1. Click the extension icon
2. Open the account menu
3. Click "Sign out"

Or simply uninstall the extension — all data is stored locally and will be removed.

### To Revoke Access:
1. Go to [GitHub Settings > Applications](https://github.com/settings/applications)
2. Find "GitHub PR Tracker"
3. Click "Revoke"

---

## Children's Privacy

This extension is not intended for children under 13. We do not knowingly collect data from children.

---

## Changes to This Policy

We may update this Privacy Policy occasionally. Changes will be posted on this page with an updated "Last Updated" date.

---

## Open Source

This extension is open source. You can review the code to verify our privacy practices:
[GitHub Repository](https://github.com/OysterD3/gh-pr)

---

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository or contact:

**Email:** oysterd3@gmail.com

---

## Summary

| Question | Answer |
|----------|--------|
| Do you sell my data? | No |
| Do you track me? | No |
| Where is my data stored? | Locally in your browser |
| Can I delete my data? | Yes, sign out or uninstall |
| Is the code open source? | Yes |
