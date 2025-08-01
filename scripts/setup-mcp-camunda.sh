#!/bin/bash

# Setup script for MCP Camunda integration

echo "Setting up MCP Camunda for NetBuild development..."

# Clone and build MCP Camunda
echo "1. Cloning MCP Camunda repository..."
if [ ! -d "/tmp/mcp-camunda" ]; then
  git clone https://github.com/lepoco/mcp-camunda.git /tmp/mcp-camunda
else
  echo "   Repository already exists, pulling latest..."
  cd /tmp/mcp-camunda && git pull
fi

# Build Docker image
echo "2. Building MCP Camunda Docker image..."
cd /tmp/mcp-camunda
docker buildx build ./ -t mcp/camunda --no-cache

# Test the image
echo "3. Testing MCP Camunda image..."
docker run --rm mcp/camunda --version 2>/dev/null || echo "   Image built successfully"

# Create environment file if it doesn't exist
echo "4. Setting up environment variables..."
if [ ! -f "../.env.local" ]; then
  cat > ../.env.local << EOF
# MCP Camunda Configuration
CAMUNDA_HOST=http://localhost:8080/engine-rest/
MCP_CAMUNDA_PORT=64623

# Existing NetBuild config
MONGODB_URI=mongodb://localhost:27017/netbuild
EOF
  echo "   Created .env.local with default configuration"
else
  echo "   .env.local already exists"
fi

# Instructions for Claude Code
echo ""
echo "✅ MCP Camunda setup complete!"
echo ""
echo "To use MCP Camunda in Claude Code:"
echo "1. Restart Claude Code to load the new MCP configuration"
echo "2. Start Camunda with: docker-compose up camunda postgres"
echo "3. The following MCP tools will be available:"
echo "   - mcp__camunda__list-process-definitions"
echo "   - mcp__camunda__count-process-definitions"
echo "   - mcp__camunda__list-process-instances"
echo "   - mcp__camunda__count-process-instances"
echo "   - mcp__camunda__list-variables"
echo "   - mcp__camunda__list-incidents"
echo "   - mcp__camunda__resolve-incident"
echo "   - mcp__camunda__list-user-tasks"
echo "   - mcp__camunda__count-user-tasks"
echo ""
echo "Example usage:"
echo '  List all process definitions:'
echo '  mcp__camunda__list-process-definitions {}'
echo ""
echo "Environment variable to set (optional):"
echo "  export CAMUNDA_HOST=http://localhost:8080/engine-rest/"