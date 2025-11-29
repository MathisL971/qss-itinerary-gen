# Security Configuration Guide

This document outlines security considerations and recommended configurations for deploying the QSS Itinerary Generator in production.

## Table of Contents

- [Authentication Configuration](#authentication-configuration)
- [Database Security (RLS)](#database-security-rls)
- [Environment Variables](#environment-variables)
- [Rate Limiting](#rate-limiting)
- [HTTPS Configuration](#https-configuration)
- [Session Management](#session-management)
- [Security Checklist](#security-checklist)

---

## Authentication Configuration

### Password Requirements

The application enforces the following password requirements:

| Setting | Development | Production (Recommended) |
|---------|-------------|--------------------------|
| Minimum Length | 8 characters | 8+ characters |
| Complexity | Upper + Lower + Numbers | Upper + Lower + Numbers |

**Configuration:** `supabase/config.toml`

```toml
[auth]
minimum_password_length = 8
password_requirements = "lower_upper_letters_digits"
```

### Email Confirmation

For production, enable email confirmation to prevent unauthorized account creation:

```toml
[auth.email]
enable_confirmations = true
double_confirm_changes = true
secure_password_change = true
```

### SMTP Configuration

Configure a production SMTP server for email delivery:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"  # Or your SMTP provider
port = 587
user = "apikey"
pass = "env(SMTP_API_KEY)"
admin_email = "admin@yourdomain.com"
sender_name = "QSS Itinerary"
```

---

## Database Security (RLS)

### Row Level Security

All tables have RLS enabled with organization-based access control:

- **Organization-scoped access**: Users can only access data belonging to their organizations
- **Role-based management**: Owners have additional privileges (member management)
- **Soft delete filtering**: SELECT policies exclude soft-deleted records (`deleted_at IS NULL`)

### Helper Functions

Two `SECURITY DEFINER` functions provide consistent access checks:

- `user_has_org_access(org_id)`: Returns true if user is a member
- `user_is_org_owner(org_id)`: Returns true if user is an owner

### Shared Itinerary Access

Shared itineraries use secure token-based access:

- Share tokens are UUIDs generated via `crypto.randomUUID()`
- Public policies only expose necessary data (no contact information)
- Related data (stays, clients, accommodations) is accessible only via joins

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SITE_URL` | Application URL | `window.location.origin` |

### Security Notes

1. **VITE_ prefix**: Variables with this prefix are exposed in the browser bundle. This is intentional for Supabase anon key (RLS protects data).

2. **Never expose**: The `SUPABASE_SERVICE_ROLE_KEY` should NEVER be used in frontend code. It bypasses RLS.

3. **Platform configuration**: For production, configure environment variables in your hosting platform (Vercel, Netlify) rather than `.env` files.

---

## Rate Limiting

### Default Configuration

```toml
[auth.rate_limit]
email_sent = 2              # Emails per hour
sms_sent = 30               # SMS per hour
token_refresh = 150         # Token refreshes per 5 min per IP
sign_in_sign_ups = 30       # Sign-ins per 5 min per IP
token_verifications = 30    # OTP verifications per 5 min per IP
```

### Captcha (Recommended for Production)

Enable captcha to prevent automated attacks:

```toml
[auth.captcha]
enabled = true
provider = "turnstile"  # or "hcaptcha"
secret = "env(CAPTCHA_SECRET_KEY)"
```

---

## HTTPS Configuration

### Local Development

HTTPS is disabled by default for local development:

```toml
[api.tls]
enabled = false
```

### Production

For production deployments:

1. **Hosting Platform**: Most platforms (Vercel, Netlify) handle HTTPS automatically
2. **Self-hosted**: Configure TLS certificates:

```toml
[api.tls]
enabled = true
cert_path = "/path/to/cert.pem"
key_path = "/path/to/key.pem"
```

---

## Session Management

### Token Expiry

```toml
[auth]
jwt_expiry = 3600                    # 1 hour (default)
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10    # seconds
```

### Session Timeouts (Recommended for Production)

Uncomment and configure session timeouts for sensitive applications:

```toml
[auth.sessions]
timebox = "24h"           # Force logout after 24 hours
inactivity_timeout = "8h" # Force logout after 8 hours of inactivity
```

---

## Security Checklist

### Before Production Deployment

- [ ] **Environment Variables**
  - [ ] All `VITE_` variables configured in hosting platform
  - [ ] No `.env` files in production
  - [ ] Service role key NOT exposed anywhere

- [ ] **Authentication**
  - [ ] Email confirmation enabled
  - [ ] Strong password requirements enforced
  - [ ] SMTP configured for email delivery
  - [ ] Captcha enabled (optional but recommended)

- [ ] **Database**
  - [ ] All migrations applied
  - [ ] RLS enabled on all tables
  - [ ] Soft delete policies active

- [ ] **HTTPS**
  - [ ] HTTPS enforced on all endpoints
  - [ ] HSTS headers configured (via hosting platform)

- [ ] **Monitoring**
  - [ ] Error tracking configured (e.g., Sentry)
  - [ ] Auth events logged
  - [ ] Rate limit alerts configured

### Periodic Security Tasks

- [ ] Review and rotate API keys quarterly
- [ ] Audit organization memberships
- [ ] Review RLS policies after schema changes
- [ ] Update dependencies regularly
- [ ] Review access logs for anomalies

---

## Incident Response

### If Credentials Are Compromised

1. **Supabase Anon Key**: Regenerate in Supabase dashboard immediately
2. **User Passwords**: Force password reset for affected users
3. **Share Tokens**: Regenerate tokens for sensitive itineraries

### Reporting Security Issues

Please report security vulnerabilities responsibly by contacting the maintainers directly rather than creating public issues.

