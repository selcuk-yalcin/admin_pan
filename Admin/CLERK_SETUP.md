# 🔐 Clerk Authentication Setup Guide

## STEP 1: Create Clerk Account & Application

### 1.1 Sign Up
1. Go to: **https://clerk.com**
2. Click **"Start Building for Free"**
3. Sign up with **GitHub** (recommended)

### 1.2 Create Application
1. Click **"+ Create Application"**
2. Configure:
   ```
   Application Name: HSE AgenticAI Admin
   
   Sign-in Options (Select these):
   ✅ Email
   ✅ Google
   ✅ GitHub (optional)
   
   Framework: React
   ```
3. Click **"Create Application"**

### 1.3 Copy API Keys
You'll see a screen with keys - **COPY THESE**:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Save them for next steps!**

---

## STEP 2: Configure Environment Variables

### 2.1 Create Local .env File

Create `/admin/Admin/.env.local`:

```bash
# Clerk Authentication Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_HERE

# Clerk URLs
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Backend API (already have this)
VITE_BACKEND_API_URL=https://hsercanalysisagenticai-production.up.railway.app
```

### 2.2 Update .gitignore

Add to `.gitignore`:
```
.env.local
.env*.local
```

---

## STEP 3: Install Package (Already Done ✅)

```bash
npm install @clerk/clerk-react
```

---

## STEP 4: Update Main App

File: `src/main.jsx`

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
```

---

## STEP 5: Create Sign-In Page

File: `src/pages/Authentication/Login.jsx`

```javascript
import React from 'react';
import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="auth-page" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl"
          }
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        redirectUrl="/dashboard"
      />
    </div>
  );
};

export default Login;
```

---

## STEP 6: Create Sign-Up Page

File: `src/pages/Authentication/Register.jsx`

```javascript
import React from 'react';
import { SignUp } from "@clerk/clerk-react";

const Register = () => {
  return (
    <div className="auth-page" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl"
          }
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        redirectUrl="/dashboard"
      />
    </div>
  );
};

export default Register;
```

---

## STEP 7: Protect Dashboard Routes

File: `src/App.jsx` (update routing)

```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

// Auth Pages
import Login from './pages/Authentication/Login';
import Register from './pages/Authentication/Register';

// Protected Pages
import Dashboard from './pages/Dashboard';
import RootCauseAnalysis from './pages/RootCauseAnalysis/Rootcauseform';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        
        <Route path="/dashboard" element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        
        <Route path="/root-cause-analysis" element={
          <>
            <SignedIn>
              <RootCauseAnalysis />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## STEP 8: Add User Button to Header

File: `src/components/VerticalLayout/Header.jsx` (or wherever header is)

```javascript
import { UserButton, useUser } from '@clerk/clerk-react';

const Header = () => {
  const { user } = useUser();

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">HSE AgenticAI</div>
        
        <div className="user-section">
          {user && (
            <>
              <span className="user-name">
                Welcome, {user.firstName}!
              </span>
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 rounded-full"
                  }
                }}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
```

---

## STEP 9: Deploy to Vercel

### 9.1 Add Environment Variables to Vercel

1. **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. **Add** these:

```
VITE_CLERK_PUBLISHABLE_KEY = pk_test_... (from Clerk Dashboard)
CLERK_SECRET_KEY = sk_test_... (from Clerk Dashboard)
VITE_CLERK_SIGN_IN_URL = /sign-in
VITE_CLERK_SIGN_UP_URL = /sign-up
VITE_CLERK_AFTER_SIGN_IN_URL = /dashboard
VITE_CLERK_AFTER_SIGN_UP_URL = /dashboard
```

4. **Save** → **Redeploy**

### 9.2 Update Clerk Dashboard

1. **Clerk Dashboard** → Your Application
2. **Paths** → **Configure**
3. Add Allowed Redirect URLs:
   ```
   https://cpanel.inferaworld.com
   https://cpanel.inferaworld.com/dashboard
   http://localhost:5173
   ```

---

## STEP 10: Test Authentication

### Local Testing:
```bash
npm run dev
```

Visit: **http://localhost:5173**
- Should redirect to `/sign-in`
- Click "Sign Up" → Create account
- Should redirect to `/dashboard` ✅

### Production Testing:
Visit: **https://cpanel.inferaworld.com**
- Should redirect to `/sign-in`
- Sign up with email or Google
- Access dashboard ✅

---

## 🎯 FEATURES YOU GET

✅ **Email + Password** authentication  
✅ **Google OAuth** (one-click login)  
✅ **GitHub OAuth** (optional)  
✅ **Email verification** (automatic)  
✅ **Password reset** (automatic)  
✅ **Session management** (automatic)  
✅ **User profile** (avatar, name, email)  
✅ **Multi-factor authentication** (2FA)  
✅ **10,000 Monthly Active Users** FREE  

---

## 📊 USER MANAGEMENT

### Clerk Dashboard Features:

1. **Users Tab**
   - See all registered users
   - Search & filter
   - Ban/unban users
   - View session history

2. **User Metadata**
   Add custom fields:
   ```json
   {
     "role": "admin",
     "company": "Infera World",
     "subscription": "premium"
   }
   ```

3. **Webhooks**
   Get notified when:
   - User signs up
   - User logs in
   - User updates profile

---

## 🔒 SECURITY BEST PRACTICES

✅ **Never commit .env.local** (added to .gitignore)  
✅ **Use environment variables** in Vercel  
✅ **Enable 2FA** for admin users (Clerk Dashboard)  
✅ **Monitor sessions** (Clerk Dashboard → Sessions)  
✅ **Rotate secrets** periodically  

---

## ❓ TROUBLESHOOTING

### "Missing Publishable Key"
→ Check `.env.local` has `VITE_CLERK_PUBLISHABLE_KEY`
→ Restart dev server: `npm run dev`

### "Redirect loop"
→ Check Clerk Dashboard → Paths are correct
→ Verify `VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard`

### "Sign in doesn't work in production"
→ Add production URL to Clerk Dashboard → Allowed Origins
→ Check Vercel environment variables are set

---

## 🚀 NEXT STEPS AFTER SETUP

1. **Customize branding** (Clerk Dashboard → Branding)
2. **Add role-based access** (admin vs user)
3. **Enable 2FA** (Clerk Dashboard → User & Authentication)
4. **Setup webhooks** (notify backend when user signs up)
5. **Add organization support** (teams/companies)

---

## 📞 NEED HELP?

Clerk Documentation: https://clerk.com/docs/quickstarts/react
Clerk Discord: https://clerk.com/discord

---

## ✅ COMPLETION CHECKLIST

- [ ] Clerk account created
- [ ] Application created in Clerk
- [ ] API keys copied
- [ ] `.env.local` file created
- [ ] `@clerk/clerk-react` installed
- [ ] `main.jsx` updated with ClerkProvider
- [ ] Sign-in page created
- [ ] Sign-up page created
- [ ] Routes protected
- [ ] UserButton added to header
- [ ] Environment variables added to Vercel
- [ ] Tested locally
- [ ] Tested in production

**When all checked, authentication is COMPLETE! 🎉**
