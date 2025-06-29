#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 AI Ticket System - Serverless Setup');
console.log('=====================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# MongoDB Connection String
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-ticket-system?retryWrites=true&w=majority

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key-here

# Frontend Server URL (for local development)
VITE_SERVER_URL=http://localhost:3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('⚠️  Please update the values in .env.local with your actual credentials\n');
} else {
  console.log('✅ .env.local file already exists\n');
}

// Check if all directories exist
const requiredDirs = [
  'api',
  'api/auth',
  'api/tickets',
  'api/models',
  'api/utils',
  'ai-ticket-frontend'
];

console.log('📁 Checking directory structure...');
for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ Missing directory: ${dir}`);
  } else {
    console.log(`✅ Found directory: ${dir}`);
  }
}

console.log('\n📋 Next Steps:');
console.log('1. Update .env.local with your actual credentials');
console.log('2. Run: npm run install:all');
console.log('3. Run: npm run dev');
console.log('4. Open http://localhost:5173 in your browser');
console.log('\n📚 For deployment instructions, see DEPLOYMENT.md');
console.log('📖 For more details, see README.md'); 