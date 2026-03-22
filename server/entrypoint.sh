#!/bin/sh
# server/entrypoint.sh
# General container entrypoint with environment initializations

echo "============================================="
echo "Node API Container Env Initialization"
echo "============================================="

echo "🔧 Setting up locals and environment context..."

if [ -z "$MONGODB_URI" ]; then
  echo "⚠️ Warning: MONGODB_URI is not set."
else
  echo "🔌 Configured to connect to: $MONGODB_URI"
fi

echo "🚀 Starting primary process..."
exec "$@"
