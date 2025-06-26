# Environment Variables Checklist for Production Deployment

## Existing Variables in Railway (Should Already Be There)
- [ ] NODE_ENV=production
- [ ] PORT=8000
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] REFRESH_TOKEN_SECRET
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GOOGLE_CALLBACK_URL
- [ ] OPENAI_API_KEY
- [ ] EMAIL_HOST
- [ ] EMAIL_PORT
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD
- [ ] EMAIL_FROM
- [ ] FRONTEND_URL=https://fizztask.com
- [ ] APP_URL=https://fizztask.com
- [ ] ALLOWED_ORIGINS=https://fizztask.com,https://www.fizztask.com

## New Variables Needed for New Features
(Add any new variables your features require)
- [ ] FEATURE_FLAG_NAME=value
- [ ] NEW_API_KEY=value
- [ ] NEW_CONFIG=value

## Notes
- Environment variables persist across deployments
- Only need to add NEW variables
- Update existing variables only if values changed
- Keep a secure backup of all production values
