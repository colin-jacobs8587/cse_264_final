#!/bin/bash

# Function to cleanup background processes when Ctrl+C is pressed
cleanup() {
    echo "Terminating processes on ports 3000, 5000, and 5001..."
    for port in 3000 5000 5001; do
        # Get all process IDs listening on the port
        pids=$(lsof -ti :$port)
        if [ -n "$pids" ]; then
            echo "Killing processes on port $port: $pids"
            kill -9 $pids
        else
            echo "No processes found on port $port."
        fi
    done
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM signals to run the cleanup function
trap cleanup SIGINT SIGTERM

# 1. Go into the aisummary folder
cd /c/Users/nhi58/OneDrive/Desktop/CSE264/cse_264_final/aisummary || exit

# 2. Start the frontend in the background
npm start &
frontend_pid=$!

# 3. Go into the backend folder
cd /c/Users/nhi58/OneDrive/Desktop/CSE264/cse_264_final/backend || exit

# 4. Start the Python backend in the background
python app.py &
python_pid=$!

# 5. Start the Node.js server in the background
node main.js &
node_pid=$!

# 6. Wait for all background jobs to finish
wait
