@echo off
echo ========================================
echo GitHub Pages Deployment Script
echo ========================================
echo.

echo Step 1: Building the project...
npm run build

echo.
echo Step 2: Committing changes...
git add -A
git commit -m "Add debug logging for Supabase operations"

echo.
echo Step 3: Pushing to GitHub...
git push

echo.
echo Step 4: Deploying to GitHub Pages...
git subtree push --prefix dist origin gh-pages

echo.
echo ========================================
echo Deployment complete!
echo Please check: https://zachzhang0.github.io/dryess-calendar/
echo ========================================
