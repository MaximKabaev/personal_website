#!/bin/bash

# Fix all return statement issues in route handlers
echo "Fixing TypeScript errors..."

# Fix unused parameters by prefixing with underscore
sed -i 's/async (req, res)/async (_req, res)/g' src/routes/folders.ts
sed -i 's/async (req, res)/async (_req, res)/g' src/routes/tweets.ts

# Fix missing returns in routes - add return before res.json and res.status calls
find src/routes -name "*.ts" -exec sed -i 's/^\s*res\.json(/    return res.json(/g' {} \;
find src/routes -name "*.ts" -exec sed -i 's/^\s*res\.status(/    return res.status(/g' {} \;

echo "Fixed TypeScript errors in route files"