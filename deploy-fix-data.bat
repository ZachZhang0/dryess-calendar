@echo off
echo ========================================
echo Deploy Fix for Data Override Issue
echo ========================================
echo.
echo This fix disables real-time subscription
echo to prevent data from being overridden.
echo.

echo Step 1: Building...
npm run build

echo.
echo Step 2: Committing...
git add -A
git commit -m "Disable real-time subscription"

echo.
echo Step 3: Pushing to GitHub...
git remote set-url origin http://github.com/ZachZhang0/dryess-calendar.git
git push

echo.
echo Step 4: Deploying to gh-pages...
echo Please manually upload dist folder to gh-pages branch:
echo 1. Go to: https://github.com/ZachZhang0/dryess-calendar/tree/gh-pages
echo 2. Delete old files
echo 3. Upload files from: dist\
echo.

echo ========================================
echo Build complete!
echo Please upload dist folder manually.
echo ========================================
pause
