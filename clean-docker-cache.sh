#!/bin/bash

###############################################################################
# Docker Cache Cleanup Script
# Purpose: Clean Docker build cache to fix snapshot errors
# Usage: Run on server before deployment if build fails
###############################################################################

set -e

echo "🧹 Cleaning Docker build cache..."

# Clean build cache
echo "Pruning builder cache..."
docker builder prune -f

# Clean dangling images
echo "Removing dangling images..."
docker image prune -f

# Optional: Clean all unused data (uncomment if needed)
# echo "Cleaning all unused Docker data..."
# docker system prune -af --volumes

echo "✅ Docker cache cleaned successfully!"
echo ""
echo "Now run: ./deploy.sh"
