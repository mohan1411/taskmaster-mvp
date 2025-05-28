@echo off
echo TaskMaster Threshold Test
echo -----------------------
echo.
echo This script will test if the recommendation system correctly shows
echo smart processing options based on email volume thresholds.
echo.

cd /d "%~dp0"
cd backend

echo Finding user to test...
node -e "const mongoose=require('mongoose');const User=require('./models/userModel');require('dotenv').config();mongoose.connect(process.env.MONGODB_URI,{useNewUrlParser:true,useUnifiedTopology:true}).then(async()=>{const users=await User.find({}).select('_id name email');if(users.length===0){console.log('No users found in database');process.exit(1);}console.log('Available users:');users.forEach((user,index)=>{console.log(`${index+1}. ${user.name} (${user.email}) - ID: ${user._id}`);});process.exit(0);}).catch(err=>{console.error('Error connecting to database:',err);process.exit(1);});"

echo.
set /p user_id="Enter user ID from the list above: "

echo.
echo Creating threshold test script...
node -e "const fs=require('fs');fs.writeFileSync('threshold-test.js', `
// Test script for email threshold recommendation
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Email = require('./models/emailModel');
const { getOnboardingRecommendations, EMAIL_VOLUME_THRESHOLD } = require('./services/onboardingRecommendationService');
require('dotenv').config();

const testThresholds = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    
    // Get user
    const userId = '${user_id}';
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    
    console.log(\`Testing recommendation thresholds for user: \${user.name} (\${user.email})\`);
    
    // Count emails
    const emailCount = await Email.countDocuments({ user: userId });
    console.log(\`User has \${emailCount} emails in the database\`);
    console.log(\`Threshold for recommendations is set to \${EMAIL_VOLUME_THRESHOLD} emails\`);
    
    // Check if above threshold
    if (emailCount > EMAIL_VOLUME_THRESHOLD) {
      console.log(\`✓ User is ABOVE threshold - should see smart processing recommendations\`);
    } else {
      console.log(\`✓ User is BELOW threshold - should NOT see smart processing recommendations\`);
    }
    
    // Get actual recommendation
    const recommendations = await getOnboardingRecommendations(userId);
    
    console.log('\\nRecommendation details:');
    console.log(\`- Show smart processing: \${recommendations.showSmartProcessing}\`);
    console.log(\`- Approach: \${recommendations.recommendation.approach}\`);
    console.log(\`- Timeframe: \${recommendations.recommendation.timeframe} days\`);
    console.log(\`- Message: "\${recommendations.recommendation.message}"\`);
    
    // Show email counts by time period
    console.log('\\nEmail distribution:');
    console.log(\`- Total emails: \${recommendations.counts.total}\`);
    console.log(\`- Last 30 days: \${recommendations.counts.last30Days}\`);
    console.log(\`- Last 90 days: \${recommendations.counts.last90Days}\`);
    console.log(\`- Last 365 days: \${recommendations.counts.last365Days}\`);
    console.log(\`- Unprocessed: \${recommendations.counts.unprocessed}\`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('\\nMongoDB connection closed');
    
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
};

// Run test
testThresholds();
`)"

echo Running threshold test...
echo.
node threshold-test.js

echo.
echo Threshold test complete!
echo.
echo This test shows whether your user's email count (%emailCount%)
echo is above or below the recommendation threshold (%threshold%).
echo.
echo If you'd like to test with different thresholds:
echo 1. Run generate-test-data.bat to create more test emails
echo 2. Or modify the EMAIL_VOLUME_THRESHOLD in onboardingRecommendationService.js
echo.
pause
