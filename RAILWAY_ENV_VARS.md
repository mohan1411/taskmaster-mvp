# Required Environment Variables for Railway Backend

## Authentication & Security
```
JWT_SECRET=<generate-a-long-random-string>
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=<generate-another-long-random-string>
REFRESH_TOKEN_EXPIRY=30d
```

## Database
```
MONGODB_URI=<your-mongodb-connection-string>
```

## Frontend URLs
```
FRONTEND_URL=https://fizztask.com
APP_URL=https://fizztask.com
ALLOWED_ORIGINS=https://fizztask.com,https://www.fizztask.com
```

## Google OAuth (if using)
```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://<your-railway-app>.railway.app/api/auth/google/callback
```

## OpenAI (for task extraction)
```
OPENAI_API_KEY=<your-openai-api-key>
```

## Email Configuration (if using)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<your-app-password>
EMAIL_FROM=noreply@fizztask.com
```

## Server Configuration
```
NODE_ENV=production
PORT=8000
```

## To Generate Secret Keys:
Run this command locally to generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```