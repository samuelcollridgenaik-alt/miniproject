#!/usr/bin/env bash
# ==============================================================================
# Cognify AI — GitHub New Repository Deployment Script
# Multimodal RAG Academic Intelligence System (MCA Mini Project)
# ==============================================================================

set -e

REPO_URL="$1"

echo "========================================================"
echo "  Cognify AI -> GitHub New Repository Deployment"
echo "========================================================"

if [ -z "$REPO_URL" ]; then
  echo "Usage: ./deploy_github.sh <GITHUB_REPO_URL>"
  echo "Example: ./deploy_github.sh https://github.com/samuelnaik/cognify-mca-rag.git"
  echo ""
  read -p "Please enter your GitHub repository URL: " REPO_URL
fi

if [ -z "$REPO_URL" ]; then
  echo "Error: No GitHub repository URL provided. Aborting."
  exit 1
fi

echo ">> 1. Checking Git initialization..."
if [ ! -d ".git" ]; then
  git init
fi

echo ">> 2. Setting main branch..."
git branch -M main

echo ">> 3. Staging project files (respecting .gitignore)..."
git add .

echo ">> 4. Creating commit..."
git commit -m "feat: Cognify AI — Notion-style MCA Multi-LLM RAG Academic Intelligence System" || echo "No changes to commit."

echo ">> 5. Configuring remote origin to: $REPO_URL..."
if git remote | grep -q "origin"; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo ">> 6. Pushing to GitHub (main branch)..."
git push -u origin main

echo ""
echo "========================================================"
echo "  SUCCESS! Cognify AI has been pushed to GitHub!"
echo "  Repository: $REPO_URL"
echo "========================================================"
