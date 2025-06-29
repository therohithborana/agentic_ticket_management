# 🚀 Deployment Guide - AI Ticket System

## ✅ FREE PLAN COMPATIBLE!

This project has been optimized for Vercel's free plan by consolidating 12+ functions into just **2 serverless functions**.

## 📋 Prerequisites

1. **MongoDB Atlas Account** (Free tier available)
2. **Gemini AI API Key** (Free tier available)
3. **Vercel Account** (Free tier)

## 🔧 Step-by-Step Deployment

### 1. Prepare Your Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-ticket-system

# Install dependencies
npm run install:all
```

### 2. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `<password>` with your database password

### 3. Get Gemini AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 5. Configure Environment Variables

In your Vercel dashboard, go to **Settings > Environment Variables** and add:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ticket-system?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### 6. Create Admin User

After deployment, you'll need to create an admin user manually in your MongoDB database:

```javascript
// In MongoDB Atlas console or MongoDB Compass
db.users.insertOne({
  email: "admin@example.com",
  password: "$2b$10$hashedPasswordHere", // Use bcrypt to hash
  role: "admin",
  skills: [],
  createdAt: new Date()
})
```

Or use the admin panel after creating a regular user and manually updating their role in the database.

## 🔍 Verification

1. Visit your deployed URL
2. Create a test account
3. Create a test ticket
4. Verify AI analysis works
5. Test admin features

## 🛠️ Troubleshooting

### Function Count Error
- ✅ **FIXED**: Project now uses only 2 functions instead of 12+

### Environment Variables
- Ensure all 3 variables are set in Vercel dashboard
- Check for typos in variable names
- Verify MongoDB connection string format

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm run install:all
npm run build
```

### CORS Issues
- The API is configured to handle CORS automatically
- No additional configuration needed

## 💰 Cost Breakdown

**Vercel Free Plan Includes:**
- ✅ 2 serverless functions (we use 2)
- ✅ 100GB bandwidth
- ✅ 100GB storage
- ✅ Automatic scaling
- ✅ Global CDN

**MongoDB Atlas Free Tier:**
- ✅ 512MB storage
- ✅ Shared clusters
- ✅ 500 connections

**Gemini AI Free Tier:**
- ✅ 15 requests per minute
- ✅ 1M characters per month

**Total Cost: $0/month** 🎉

## 🔄 Updates

To update your deployment:

```bash
git pull origin main
vercel --prod
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Vercel function logs
3. Verify environment variables
4. Create an issue in the repository 