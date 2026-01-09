---
description: Deploy Cortana to VPS
---

# VPS Deployment Command

Run the following command on your VPS to deploy the latest changes:

```bash
cd /var/www/cortana && git stash && git pull && cd CORTANA-WEB-2 && npm run build && pm2 restart cortana
```

## Breakdown

1. `cd /var/www/cortana` - Navigate to the project root
2. `git stash` - Stash any local changes on the VPS
3. `git pull` - Pull the latest code from the repository
4. `cd CORTANA-WEB-2` - Navigate to the web project directory
5. `npm run build` - Build the production bundle
6. `pm2 restart cortana` - Restart the PM2 process named "cortana"
