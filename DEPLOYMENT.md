# AI Ticket System - Serverless Deployment Guide

This guide will help you deploy the AI Ticket System to Vercel or Netlify using serverless functions.

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or other MongoDB provider)
- Vercel account (or Netlify account)
- Gemini API key (for AI features)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
VITE_SERVER_URL=your_deployment_url
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Set up environment variables:**
   ```bash
   vercel env add MONGO_URI
   vercel env add JWT_SECRET
   vercel env add GEMINI_API_KEY
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Update frontend environment:**
   - Go to your Vercel dashboard
   - Find your deployment URL
   - Add `VITE_SERVER_URL=https://your-app.vercel.app` to your environment variables

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Create netlify.toml:**
   ```toml
   [build]
     command = "npm run build"
     publish = "ai-ticket-frontend/dist"
     functions = "api"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

## Local Development

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend on `http://localhost:5173`
   - Backend API on `http://localhost:3000`

3. **Set up environment variables for local development:**
   Create `.env.local` in the root directory with your local values.

## API Endpoints

The serverless functions are organized as follows:

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/users` - Get all users (admin only)
- `POST /api/auth/create-user` - Create user (admin only)
- `POST /api/auth/update-user` - Update user (admin only)
- `DELETE /api/auth/delete-user` - Delete user (admin only)

### Tickets
- `GET /api/tickets` - Get tickets
- `POST /api/tickets/create` - Create ticket
- `GET /api/tickets/[id]` - Get ticket details
- `POST /api/tickets/[id]/comment` - Add comment
- `PUT /api/tickets/[id]/resolve` - Resolve ticket
- `GET /api/tickets/moderators-admins` - Get moderators and admins

## Database Setup

1. **MongoDB Atlas:**
   - Create a new cluster
   - Get your connection string
   - Add it to your environment variables

2. **Create an admin user:**
   - Deploy the application
   - Sign up with your email
   - Manually update the user role to "admin" in your database

## Troubleshooting

### Common Issues

1. **CORS errors:**
   - Ensure your frontend URL is correctly set in environment variables
   - Check that API routes are properly configured

2. **Database connection issues:**
   - Verify your MongoDB connection string
   - Check that your IP is whitelisted in MongoDB Atlas

3. **AI features not working:**
   - Verify your Gemini API key is correct
   - Check that the API key has proper permissions

### Performance Optimization

1. **Database indexing:**
   ```javascript
   // Add these indexes to your MongoDB collections
   db.users.createIndex({ "email": 1 })
   db.tickets.createIndex({ "createdBy": 1 })
   db.tickets.createIndex({ "status": 1 })
   ```

2. **Caching:**
   - Consider implementing Redis for session storage
   - Use CDN for static assets

## Security Considerations

1. **Environment variables:**
   - Never commit sensitive data to version control
   - Use Vercel/Netlify environment variable management

2. **Authentication:**
   - JWT tokens are used for authentication
   - Tokens expire after 7 days
   - Implement refresh tokens for production

3. **Rate limiting:**
   - Consider implementing rate limiting for API endpoints
   - Use Vercel's built-in rate limiting features

## Monitoring

1. **Vercel Analytics:**
   - Enable Vercel Analytics for performance monitoring
   - Set up error tracking

2. **Logs:**
   - Monitor function logs in Vercel dashboard
   - Set up alerts for errors

## Scaling

The serverless architecture automatically scales based on demand. No additional configuration is needed for basic scaling.

For high-traffic applications:
- Consider using MongoDB Atlas M10+ clusters
- Implement connection pooling
- Use edge functions for global performance 