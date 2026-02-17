# SSO and 2FA Setup Guide

## 🔐 Two-Factor Authentication (2FA)

### Features
- TOTP-based authentication (compatible with Google Authenticator, Authy, etc.)
- QR code generation for easy setup
- Backup codes for account recovery
- Enable/disable functionality

### API Endpoints

#### Setup 2FA
```bash
POST /auth/2fa/setup
Authorization: Bearer <token>

Response:
{
  "secret": "BASE32_SECRET",
  "qr_code": "BASE64_QR_IMAGE",
  "backup_codes": ["CODE1", "CODE2", ...]
}
```

#### Verify and Enable 2FA
```bash
POST /auth/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### Disable 2FA
```bash
POST /auth/2fa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### Login with 2FA
```bash
POST /auth/login/2fa
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "token": "123456"
}
```

### Frontend Usage

1. Navigate to Settings page
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Download and save backup codes
5. Enter 6-digit code to verify

---

## 🌐 Single Sign-On (SSO)

### Supported Providers
- Google OAuth 2.0

### Setup Google OAuth

#### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - App name: Multi-Cloud Platform
   - User support email: your-email@example.com
   - Authorized domains: localhost (for development)
6. Create OAuth Client ID:
   - Application type: Web application
   - Name: Multi-Cloud Platform
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/sso/google/callback` (development)
     - `https://yourdomain.com/auth/sso/google/callback` (production)
7. Copy **Client ID** and **Client Secret**

#### 2. Update Environment Variables

Edit `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### 3. Restart Backend

```bash
docker-compose restart backend
```

### API Endpoints

#### Initiate Google Login
```bash
GET /auth/sso/google/login
```
Redirects to Google OAuth consent screen.

#### OAuth Callback (handled automatically)
```bash
GET /auth/sso/google/callback?code=...&state=...

Response:
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer",
  "is_new_user": true/false
}
```

### Frontend Usage

1. Click "Sign in with Google" button on login page
2. Redirected to Google OAuth
3. Grant permissions
4. Automatically logged in and redirected to dashboard

---

## 🔄 Database Migration

Run migration to add new columns:

```bash
docker exec -it multi-cloud-backend-1 python -m app.db.migrate
```

New columns added:
- `users.two_factor_secret` - TOTP secret
- `users.sso_provider` - SSO provider name (google, github, etc.)
- `users.sso_id` - Provider's user ID
- `users.hashed_password` - Now nullable for SSO-only users

---

## 🧪 Testing

### Test 2FA

1. **Setup:**
   ```bash
   curl -X POST http://localhost:8000/auth/2fa/setup \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Verify:**
   ```bash
   curl -X POST http://localhost:8000/auth/2fa/verify \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"token": "123456"}'
   ```

3. **Login with 2FA:**
   ```bash
   curl -X POST http://localhost:8000/auth/login/2fa \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "password",
       "token": "123456"
     }'
   ```

### Test SSO

1. Open browser: `http://localhost:5173/login`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Check if logged in successfully

---

## 🔒 Security Best Practices

1. **2FA:**
   - Store backup codes securely
   - Use time-based tokens (TOTP) with 30-second window
   - Implement rate limiting on verification attempts

2. **SSO:**
   - Use HTTPS in production
   - Validate OAuth state parameter
   - Store minimal user data from provider
   - Implement PKCE for enhanced security

3. **General:**
   - Rotate SECRET_KEY regularly
   - Use strong JWT expiration times
   - Implement session management
   - Log authentication attempts

---

## 📦 Dependencies

Added to `requirements.txt`:
- `pyotp` - TOTP generation and verification
- `qrcode[pil]` - QR code generation
- `authlib` - OAuth client library
- `httpx` - Async HTTP client for OAuth

---

## 🎯 Next Steps

1. **Add more SSO providers:**
   - GitHub OAuth
   - Microsoft Azure AD
   - AWS Cognito

2. **Enhanced 2FA:**
   - SMS-based 2FA
   - Email-based 2FA
   - Hardware security keys (WebAuthn)

3. **Security features:**
   - Login history
   - Device management
   - Suspicious activity alerts
   - IP whitelisting

---

## 🐛 Troubleshooting

### 2FA Issues

**Problem:** QR code not scanning
- Solution: Try manual entry with the secret key

**Problem:** Token always invalid
- Solution: Check device time synchronization

### SSO Issues

**Problem:** Redirect URI mismatch
- Solution: Ensure callback URL matches Google Console settings

**Problem:** OAuth consent screen error
- Solution: Verify OAuth consent screen is configured and published

---

## 📞 Support

For issues or questions:
1. Check backend logs: `docker logs multi-cloud-backend-1`
2. Check frontend console for errors
3. Verify environment variables are set correctly
4. Ensure database migration ran successfully
