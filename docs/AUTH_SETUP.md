# Authentication Setup Guide

## Overview

ChatDesk uses Supabase Auth for authentication with the following features:
- Email/Password authentication
- Magic link (OTP) authentication
- Role-based access control (RBAC)
- Multi-tenant organization isolation

---

## Supabase Auth Configuration

### 1. Enable Email Auth

Go to your Supabase Dashboard:
1. Navigate to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   - ✅ Enable email confirmations (optional for production)
   - ✅ Enable email OTP (magic links)
   - ⚠️ Disable email confirmations for development

### 2. Configure Auth Settings

Go to **Authentication** → **Settings**:

**Site URL**: `http://localhost:3000` (development)
**Redirect URLs**: 
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/dashboard`

**JWT Expiry**: 3600 (1 hour)
**Refresh Token Expiry**: 2592000 (30 days)

### 3. Email Templates (Optional)

Customize email templates in **Authentication** → **Email Templates**:
- Confirmation email
- Magic link email
- Password reset email

---

## User Roles

ChatDesk has 4 user roles:

1. **super_admin**: Platform administrator (manages all organizations)
2. **org_admin**: Organization administrator (manages their organization)
3. **agent**: Support agent (handles customer conversations)
4. **customer**: End user (chats with agents)

---

## Authentication Flow

### Sign Up Flow

```
1. User enters email + password
2. Supabase creates auth.users record
3. Trigger creates users table record with role
4. User is redirected to dashboard
5. Role-based UI is displayed
```

### Sign In Flow

```
1. User enters email + password (or magic link)
2. Supabase validates credentials
3. Session is created
4. User profile is fetched from users table
5. Role-based redirect
```

### Magic Link Flow

```
1. User enters email
2. Supabase sends magic link email
3. User clicks link
4. Session is created
5. User is redirected to dashboard
```

---

## Database Trigger for User Creation

When a user signs up via Supabase Auth, we need to create a corresponding record in the `users` table.

This is handled by a database trigger (already created in migrations).

---

## Protected Routes

Routes are protected based on user roles:

| Route | Allowed Roles |
|-------|--------------|
| `/` | Public |
| `/login` | Public |
| `/signup` | Public |
| `/dashboard` | All authenticated |
| `/dashboard/admin` | org_admin, super_admin |
| `/dashboard/agents` | agent, org_admin, super_admin |
| `/dashboard/conversations` | agent, org_admin, super_admin |
| `/dashboard/customers` | customer |

---

## Implementation Checklist

- [x] Enable email auth in Supabase
- [x] Configure redirect URLs
- [ ] Create auth context
- [ ] Create auth hooks
- [ ] Build login page
- [ ] Build signup page
- [ ] Implement protected routes
- [ ] Add role-based access control
- [ ] Test authentication flow

---

## Security Best Practices

1. **Never expose service_role key** in client-side code
2. **Use RLS policies** for all database access
3. **Validate user roles** on both client and server
4. **Use HTTPS** in production
5. **Implement rate limiting** for auth endpoints
6. **Enable email confirmations** in production
7. **Use strong password policies**

---

## Troubleshooting

### "Invalid login credentials"
- Check email/password are correct
- Verify user exists in auth.users table
- Check if email confirmation is required

### "User not found in users table"
- Check if database trigger is working
- Manually create user record if needed

### "Redirect not working"
- Verify redirect URL is in allowed list
- Check middleware configuration

---

**Last Updated**: 2025-10-31

