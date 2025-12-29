# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign in with GitHub
3. Click "New Project"
4. Fill in details:
   - **Name:** inferaworld-bot
   - **Database Password:** (Save this securely!)
   - **Region:** Europe (Frankfurt or Amsterdam)
5. Click "Create new project" (takes ~2 minutes)

## 2. Get API Credentials

1. Go to Project Settings (gear icon)
2. Click "API" in the sidebar
3. Copy these values to `Admin/.env.local`:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

Example `.env.local`:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - **Enable Email Confirmations:** ON (recommended)
   - **Secure Email Change:** ON
   - **Email Redirects:** Add your domains
     - http://localhost:5173
     - https://panel.inferaworld.com

## 4. Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirm Signup
   - Magic Link
   - Change Email Address
   - Reset Password

## 5. Create User Profile Table

Run this SQL in Supabase SQL Editor:

\`\`\`sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
\`\`\`

## 6. Test Authentication

1. Start dev server: `npm run dev`
2. Go to login page
3. Create test account
4. Check Supabase Dashboard → Authentication → Users

## 7. Production Deployment

When deploying to Hostinger:

1. Create production `.env` file with same variables
2. Build project: `npm run build`
3. Upload `dist` folder to Hostinger
4. Add production URL to Supabase email redirects

## Troubleshooting

### CORS Issues
Add your domain to Supabase → Settings → API → CORS

### Email Not Sending
1. Check spam folder
2. Verify email provider settings
3. Use custom SMTP (Settings → Project Settings → Email)

### Authentication Errors
1. Check API keys are correct
2. Verify environment variables are loaded
3. Check browser console for errors

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [React Integration](https://supabase.com/docs/guides/auth/auth-helpers/react)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
