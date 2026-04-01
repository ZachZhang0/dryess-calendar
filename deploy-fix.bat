@echo off
echo ========================================
echo Complete Deployment Script
echo ========================================
echo.

echo Step 1: Clean build...
rmdir /s /q dist
npm run build

echo.
echo Step 2: Check dist folder...
dir dist

echo.
echo Step 3: Commit changes...
git add -A
git commit -m "Deploy updated build"

echo.
echo Step 4: Push to GitHub master...
git remote set-url origin http://github.com/ZachZhang0/dryess-calendar.git
git push

echo.
echo Step 5: Delete remote gh-pages branch...
git push origin --delete gh-pages

echo.
echo Step 6: Deploy to GitHub Pages...
git subtree push --prefix dist origin gh-pages

echo.
echo ========================================
echo Deployment complete!
echo Visit: https://zachzhang0.github.io/dryess-calendar/
echo ========================================
pause
