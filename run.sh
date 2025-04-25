#!/bin/bash

# Function to cleanup background processes when Ctrl+C is pressed
cleanup() {
    echo "TERMINATING PROCESSES ON PORTS 3000, 5000, AND 5001..."
    for port in 3000 5000 5001; do
        pids=$(lsof -ti :$port)
        if [ -n "$pids" ]; then
            echo "KILLING PROCESSES ON PORT $port: $pids"
            kill -9 $pids
        else
            echo "NO PROCESSES FOUND ON PORT $port."
        fi
    done
    exit 0
}

trap cleanup SIGINT SIGTERM

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Backend setup
echo "STARTING BACKEND SETUP..."
cd "$SCRIPT_DIR/backend" || exit
echo "INSTALLING BACKEND DEPENDENCIES..."
npm install
pip install -r requirements.txt

# Start python backend
echo "STARTING PYTHON BACKEND..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    python3 app.py &
else
    python app.py &
fi
python_pid=$!

# Start node server
echo "STARTING NODE.JS SERVER..."
node main.js &
node_pid=$!

# Wait for python backend
echo "WAITING FOR PYTHON BACKEND TO START..."
until curl -s http://127.0.0.1:5001 >/dev/null; do
    echo "STILL WAITING..."
    sleep 1
done
echo "PYTHON BACKEND IS UP!"

# Frontend setup
echo "STARTING FRONTEND SETUP..."
cd "$SCRIPT_DIR/aisummary" || exit
echo "INSTALLING FRONTEND DEPENDENCIES..."
npm install

# Start frontend
echo "STARTING FRONTEND..."
npm start &
frontend_pid=$!

# Wait for all background jobs to finish
wait