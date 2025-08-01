#!/bin/bash

# Script to launch multiple browser profiles for NetBuild demo
# Each profile will have isolated sessions

echo "🚀 Launching NetBuild Demo Browsers..."

# Kill any existing Chrome processes to ensure clean sessions
echo "Cleaning up existing sessions..."
pkill -f "Google Chrome"
sleep 2

# Launch browsers with different profiles
echo "Opening Demo User (Admin)..."
open -na "Google Chrome" --args --profile-directory="NetBuildDemo" --window-position=0,0 --window-size=1200,800 http://localhost:3001 &

sleep 2

echo "Opening John (Sales)..."
open -na "Google Chrome" --args --profile-directory="NetBuildJohn" --window-position=1220,0 --window-size=1200,800 http://localhost:3001 &

sleep 2

echo "Opening Mary (Accounting)..."
open -na "Google Chrome" --args --profile-directory="NetBuildMary" --window-position=0,850 --window-size=1200,800 http://localhost:3001 &

sleep 2

echo "Opening Peter (Management)..."
open -na "Google Chrome" --args --profile-directory="NetBuildPeter" --window-position=1220,850 --window-size=1200,800 http://localhost:3001 &

echo ""
echo "✅ All demo browsers launched!"
echo ""
echo "Login credentials:"
echo "  Profile 1 (Top Left):     demo / demo    (Admin)"
echo "  Profile 2 (Top Right):    john / john    (Sales)" 
echo "  Profile 3 (Bottom Left):  mary / mary    (Accounting)"
echo "  Profile 4 (Bottom Right): peter / peter  (Management)"
echo ""
echo "Each window has its own isolated session - you can be logged in as different users simultaneously!"