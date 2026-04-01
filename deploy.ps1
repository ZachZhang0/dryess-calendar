# GitHub Pages Deployment Script for PowerShell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Pages Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Building the project..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Step 2: Committing changes..." -ForegroundColor Yellow
git add -A
git commit -m "Deploy updated build"

Write-Host ""
Write-Host "Step 3: Pushing to GitHub master..." -ForegroundColor Yellow
git remote set-url origin http://github.com/ZachZhang0/dryess-calendar.git
git push

Write-Host ""
Write-Host "Step 4: Deploying to GitHub Pages..." -ForegroundColor Yellow
git push origin --delete gh-pages
git subtree push --prefix dist origin gh-pages

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Visit: https://zachzhang0.github.io/dryess-calendar/" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
