# 🚀 GachAdda — Vercel Deployment Guide

Your complete plant marketplace is ready to deploy!

## ✅ Already Done

- ✅ Full codebase pushed to GitHub: https://github.com/SNEHASIS-CODEHUB04/GachAdda
- ✅ Production build tested (zero errors)
- ✅ Prisma schema ready (30+ models)
- ✅ NextAuth v5 configured
- ✅ Next.js 16 with proxy (middleware migrated)

---

## 📋 Vercel Deployment Steps

### 1. Set Up Production Database (Neon Postgres - FREE)

1. Go to https://console.neon.tech/
2. Create a free account if you don't have one
3. Click **New Project**
4. Name: `gachadda-production`
5. Region: Choose closest to your users (e.g., US East, Asia Pacific)
6. Click **Create Project**
7. Copy the **Connection String** (looks like `postgresql://username:password@host/database`)

### 2. Deploy to Vercel

1. Go to https://vercel.com/snehasis-duttas-projects
2. Click **Add New...** → **Project**
3. Import `GachAdda` repository
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Install Command**: `npm install` (default)

5. **Add Environment Variables** (click "Environment Variables" tab):

```bash
# Database (from Neon Console - Step 1)
DATABASE_URL=postgresql://your-neon-connection-string-here
DIRECT_URL=postgresql://your-neon-connection-string-here

# Auth Secret (generate new for production)
AUTH_SECRET=your-production-secret-here

# App URLs (update after deployment)
NEXTAUTH_URL=https://gach-adda.vercel.app
NEXT_PUBLIC_APP_URL=https://gach-adda.vercel.app
```

#### 🔐 Generate Production AUTH_SECRET

Run this command on your machine:
```bash
openssl rand -base64 32
```
Or generate online: https://generate-secret.vercel.app/32

6. Click **Deploy**

### 3. Initialize Database

After deployment completes:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` is set
3. Go to **Deployments** → Click the latest deployment → **View Function Logs**
4. Vercel automatically runs `npx prisma generate` during build

To create tables, you have 2 options:

**Option A: Use Prisma Studio (Recommended)**
```bash
# On your local machine, update .env with production DATABASE_URL temporarily
npx prisma db push
```

**Option B: Run migration from Vercel CLI**
```bash
npm i -g vercel
vercel env pull .env.production
npx prisma db push
```

### 4. Update Production URLs

1. After deployment, Vercel gives you a URL like: `https://gach-adda-xyz.vercel.app`
2. Go to Vercel → **Settings** → **Environment Variables**
3. Update these values:
   ```
   NEXTAUTH_URL=https://your-actual-vercel-url.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-actual-vercel-url.vercel.app
   ```
4. Trigger a redeploy: **Deployments** → **...** → **Redeploy**

---

## 🎯 Post-Deployment Checklist

- [ ] Database tables created (`npx prisma db push`)
- [ ] Landing page loads: `https://your-app.vercel.app`
- [ ] Registration works: `/register`
- [ ] Login redirects properly: `/login`
- [ ] Buyer dashboard accessible after login
- [ ] Seller dashboard accessible after login

---

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon Postgres connection string | `postgresql://user:pass@host/db` |
| `DIRECT_URL` | Same as DATABASE_URL | `postgresql://user:pass@host/db` |
| `AUTH_SECRET` | NextAuth encryption key (32+ chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your deployed Vercel URL | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Public app URL for client-side | `https://your-app.vercel.app` |

---

## 🐛 Troubleshooting

### Build fails with "Prisma Client not generated"
- Vercel automatically runs `npx prisma generate` during build
- Check **Build Logs** for errors
- Ensure `prisma/schema.prisma` exists in repo

### Database connection errors
- Verify `DATABASE_URL` is correct in Vercel environment variables
- Check Neon database is not paused (free tier auto-pauses after inactivity)
- Go to Neon Console → click your database → ensure it's **Active**

### "Invalid credentials" on login
- Database tables not created yet — run `npx prisma db push`
- No users exist — register a new account first

### Redirect loops after login
- `NEXTAUTH_URL` must match your deployed Vercel URL exactly
- Include `https://` prefix
- No trailing slash

---

## 📚 Features Ready for Production

✅ **Authentication**: NextAuth v5 with Buyer/Seller roles  
✅ **Database**: Full Prisma schema (Users, Products, Orders, Reviews, Chat)  
✅ **UI**: Responsive design system, mobile-optimized  
✅ **Performance**: Image optimization, lazy loading, pagination  
✅ **Security**: Protected routes, role-based access control  
✅ **SEO**: Metadata configured for all public pages  

---

## 🎉 Your App Structure

```
Landing Page       → https://your-app.vercel.app
Marketplace        → https://your-app.vercel.app/marketplace
Product Details    → https://your-app.vercel.app/products/[slug]
Community Feed     → https://your-app.vercel.app/community

Buyer Dashboard    → https://your-app.vercel.app/buyer/dashboard
Seller Dashboard   → https://your-app.vercel.app/seller/dashboard
```

---

**Need help?** Check Vercel logs: Project → Deployments → [Latest] → View Function Logs