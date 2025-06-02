#!/bin/bash

echo "🚀 Quick Deploy to Production"
echo "============================="

# Navigate to dev directory
cd "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development"

echo "📝 Adding all changes..."
git add .

echo "💾 Committing changes..."
git commit -m "🔧 Fix email sync and task extraction for production

✅ Fixed OAuth authentication issues
✅ Added email sync functionality with visible buttons  
✅ Fixed task extraction to save tasks to database
✅ Enhanced task visibility on Tasks page
✅ Improved error handling and user feedback

Ready for production deployment."

echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment to GitHub complete!"
echo ""
echo "🔗 GitHub Repository: https://github.com/mohan1411/taskmaster-mvp"
echo "🌐 Production Site: https://fizztask.com"
echo ""
echo "📋 Next steps for production:"
echo "1. Pull latest changes in production environment"
echo "2. Update production environment variables"
echo "3. Restart production services"
echo "4. Test email sync functionality"
echo ""

read -p "Press Enter to continue..."
