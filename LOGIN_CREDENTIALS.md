# FizzTask Demo Login Credentials

## Official Demo User Credentials:
```
Email:    newuser@example.com
Password: demo123
```

## If You Can't Login:

### Quick Fix (Recommended):
Run this file:
```
INSTANT-LOGIN-FIX.bat
```

### Other Fix Options:
1. **Reset Password Only:**
   ```
   reset-password.bat
   ```

2. **Complete Login Fix:**
   ```
   FIX-LOGIN-ISSUE.bat
   ```

3. **Manual Fix:**
   ```bash
   cd backend
   node create-fresh-demo-user.js
   ```

## Common Login Issues:

### 1. "Invalid username or password"
- The password might have been corrupted during population
- Run `INSTANT-LOGIN-FIX.bat` to recreate the user

### 2. "Network Error" or "500 Error"
- Backend server is not running
- Run `QUICK-FIX-NOW.bat` to start servers

### 3. "Cannot connect to server"
- MongoDB is not running
- Start MongoDB: `mongod`

## Test Login Manually:
```bash
cd backend
node test-login.js
```

## List All Users:
```bash
cd backend
node list-all-users.js
```

## Important Notes:
- Email is case-insensitive
- Password is case-sensitive (all lowercase: demo123)
- Make sure you're typing the password correctly
- Clear browser cache if issues persist

## Still Can't Login?
1. Check backend console for errors
2. Verify MongoDB is running
3. Make sure both servers are running (ports 3000 & 5000)
4. Try incognito/private browser mode