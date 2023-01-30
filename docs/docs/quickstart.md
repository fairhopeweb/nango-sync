---
sidebar_label: Quickstart
---

# 🚀 Quickstart

Clone the repo and start Nango:

```bash
git clone https://github.com/NangoHQ/nango.git && cd nango
docker compose up
```

Make sure you have a client ID & secret ready for the API you want to use, e.g. for GitHub [register here](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app). Use `http://localhost:3003/oauth/callback` as the callback URL.

In a new terminal window, configure a new Github integration with our CLI (outside the `nango` repo):
```bash
cd ~ && npx nango config:create github github <client-id> <client-secret> "user,public_repo"
```

In a new terminal window, go to the `nango` repo and serve the demo page: 
```bash
cd packages/frontend && python3 -m http.server 8080
```

Go to the demo [page](http://localhost:8080/bin/quickstart.html) and start an OAuth flow with `github` as the config key and `1` as the connection ID.

Finally, fetch a fresh access token to make API calls with the API:
```bash
curl -XGET -G \
  'http://localhost:3003/connection/1?provider-config_key=github'
```

or with Node:
```bash
npm i nangohq/node
```
```ts
import { Nango } from '@nangohq/node';
let nango = new Nango();
var githubAccessToken = await nango.accessToken('github', '1');
```

Et voilà ! Nango will permanently store & refresh your tokens safely. For production usage, read our docs about [Self-Hosted](category/deploy-nango-sync-open-source) & [Cloud](cloud.md) options.