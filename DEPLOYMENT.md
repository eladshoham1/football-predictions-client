# 🚀 GitHub Pages Deployment Guide

## 📋 Prerequisites

Before deploying, make sure you have:
- ✅ Backend deployed and running (e.g., on Render.com)
- ✅ Backend URL ready (e.g., `https://your-app.onrender.com`)
- ✅ GitHub repository for the client

## 🔧 Step 1: Configure for Your Repository

### Update `vite.config.ts`

Change the base path to match your repository name:

```typescript
base: process.env.GITHUB_PAGES === 'true' ? '/YOUR-REPO-NAME/' : '/',
```

Replace `YOUR-REPO-NAME` with your actual GitHub repository name.

**Example:** If your repo is `github.com/username/worldcup-client`, use:
```typescript
base: process.env.GITHUB_PAGES === 'true' ? '/worldcup-client/' : '/',
```

### Update `public/404.html`

Edit line 14 to match your repository name:

```html
<meta http-equiv="refresh" content="0;URL='/YOUR-REPO-NAME/'">
```

This enables proper routing for single-page apps on GitHub Pages.

## 🔑 Step 2: Configure GitHub Repository

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. Save

### 2. Add Environment Secret

The workflow needs your backend URL:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add:
   - Name: `VITE_API_URL`
   - Value: `https://YOUR-BACKEND.onrender.com` (your actual backend URL)
4. Click **"Add secret"**

## 🚀 Step 3: Deploy

```bash
cd client

# Commit all changes
git add .
git commit -m "Configure for GitHub Pages deployment"
git push origin main
```

GitHub Actions will automatically:
1. ✅ Install dependencies
2. ✅ Build the application with your API URL
3. ✅ Deploy to GitHub Pages

**Deployment takes ~2-3 minutes**

Your site will be live at:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

## 🔄 Step 4: Update Backend CORS

After deployment, update your backend to allow your frontend domain:

### In Render Dashboard (or your hosting platform):

Add/update environment variable:
```env
FRONTEND_URL=https://YOUR-USERNAME.github.io/YOUR-REPO-NAME
```

**Important:** Remove trailing slash if your backend strips it!

Then restart your backend service.

## 🔐 Step 5: Update Google OAuth

Add your production domain to Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://YOUR-USERNAME.github.io
   ```
5. Backend callback URL should already be set (no changes needed)
6. Click **Save**

## ✅ Step 6: Verify Deployment

### Test Your Live Site

1. **Visit your deployed URL:**
   ```
   https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
   ```

2. **Check the site loads properly**
   - Should see the World Cup 2026 interface
   - Hebrew text displays correctly (RTL)
   - No errors in browser console (F12)

3. **Test Google Authentication**
   - Click "Sign in with Google"
   - Should complete OAuth flow successfully
   - Should redirect back to your app

4. **Test Functionality**
   - Try making a match prediction
   - Check the leaderboard
   - Navigate between pages

## 🐛 Troubleshooting

### Build Failed on GitHub Actions

**Error:** `npm ci` fails or build errors

**Solution:**
```bash
# Ensure package-lock.json is committed
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### 404 Error When Refreshing Pages

**Error:** Refreshing `/matches` or other routes shows 404

**Solution:** Check `public/404.html` exists and has correct redirect URL matching your repo name.

### API Calls Fail / CORS Errors

**Error:** `CORS policy blocked` or `Failed to fetch`

**Solutions:**
1. Check `VITE_API_URL` secret is set correctly in GitHub
2. Verify backend `FRONTEND_URL` includes your GitHub Pages URL
3. Restart backend service after updating CORS

### OAuth Redirect Loop

**Error:** Keeps redirecting to sign-in page

**Solutions:**
1. Clear browser cookies for your domain
2. Check Google OAuth authorized origins includes `https://YOUR-USERNAME.github.io`
3. Verify backend `FRONTEND_URL` is correct

### Blank Page After Deployment

**Error:** Page loads but shows nothing

**Solutions:**
1. Check browser console for errors (F12)
2. Verify `vite.config.ts` base path matches your repo name
3. Check `VITE_API_URL` is accessible from browser

## 📝 Deployment Checklist

- [ ] Backend deployed and URL ready
- [ ] `vite.config.ts` - base path updated with your repo name
- [ ] `public/404.html` - redirect URL updated with your repo name
- [ ] GitHub Pages enabled (Settings → Pages → GitHub Actions)
- [ ] `VITE_API_URL` secret added in GitHub repo
- [ ] All changes committed and pushed
- [ ] Backend `FRONTEND_URL` updated with GitHub Pages URL
- [ ] Backend service restarted
- [ ] Google OAuth origins updated with GitHub Pages domain
- [ ] Deployment successful (GitHub Actions green ✅)
- [ ] Site loads correctly
- [ ] Google OAuth works
- [ ] API calls work
- [ ] All pages accessible

## 🔄 Auto-Deploy

Every time you push to `main` branch:
- ✅ GitHub Actions automatically triggers
- ✅ Builds your app with latest code
- ✅ Deploys to GitHub Pages
- ✅ Usually takes 2-3 minutes

No manual deployment needed!

## 📊 Your URLs

After deployment, you'll have:

**Frontend (GitHub Pages):**
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

**Backend (Render.com):**
```
https://YOUR-APP.onrender.com
```

**Example** (if username is `johndoe` and repo is `worldcup-client`):
- Frontend: `https://johndoe.github.io/worldcup-client/`
- Backend: `https://worldcup-api.onrender.com`

These URLs go in:
1. Backend `.env` → `FRONTEND_URL`
2. GitHub repo secrets → `VITE_API_URL`
3. Google Console → Authorized JavaScript origins

## 🌟 Next Steps

- ✅ Share your live URL with friends!
- ✅ Start making predictions for World Cup 2026
- ✅ Monitor the leaderboard
- ⚽ Enjoy the tournament!

## 💡 Tips

### Custom Domain (Optional)

You can use a custom domain with GitHub Pages:
1. Buy a domain (e.g., from Namecheap, Google Domains)
2. GitHub repo Settings → Pages → Custom domain
3. Add CNAME record in your DNS provider
4. Update all URLs (backend CORS, Google OAuth)

### Monitor Deployments

View deployment history:
- GitHub repo → Actions tab
- See all builds and their status
- Click any workflow to see logs

### Roll Back

If something breaks:
```bash
git revert HEAD
git push
```

GitHub will automatically deploy the previous version.

---

## 🎉 Congratulations!

Your World Cup 2026 Predictions app is now live on GitHub Pages! 🏆⚽

**Totally FREE hosting forever!** 🎊
