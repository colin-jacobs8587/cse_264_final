#!/bin/bash

# Function to cleanup background processes when Ctrl+C is pressed
cleanup() {
    echo "TERMINATING PROCESSES ON PORTS 3000, 5000, 5001, AND 6379..."
    for port in 3000 5000 5001 6379; do
        pids=$(lsof -ti :$port)
        if [ -n "$pids" ]; then
            echo "KILLING PROCESSES ON PORT $port: $pids"
            kill -9 $pids
        else
            echo "NO PROCESSES FOUND ON PORT $port."
        fi
    done

    # Shut down Redis
    if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
        # Linux / macOS with sudo privileges
        sudo redis-cli -p 6379 shutdown >/dev/null 2>&1
    elif command -v redis-cli >/dev/null 2>&1; then
        # Linux / macOS without sudo required
        redis-cli -p 6379 shutdown >/dev/null 2>&1
    elif command -v redis-cli.exe >/dev/null 2>&1; then
        # Native Windows
        redis-cli.exe -p 6379 shutdown >/dev/null 2>&1
    elif command -v wsl >/dev/null 2>&1; then
        # Trigger shutdown inside WSL
        wsl -e redis-cli -p 6379 shutdown >/dev/null 2>&1
    fi

    exit 0
}

trap cleanup SIGINT SIGTERM

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Redis setup
echo "CHECKING REDIS…"

# 1) Windows-native Redis (redis-server.exe / redis-cli.exe on PATH)
if timeout 2 redis-cli.exe -p 6379 ping >/dev/null 2>&1; then
    echo "REDIS IS ALREADY RUNNING (Windows)."

elif command -v redis-server.exe >/dev/null 2>&1; then
    echo "REDIS NOT RUNNING — STARTING WINDOWS REDIS…"
    redis-server.exe --maxmemory 256mb --maxmemory-policy allkeys-lru &
    redis_pid=$!
    until timeout 1 redis-cli.exe -p 6379 ping >/dev/null 2>&1; do
        echo "WAITING FOR WINDOWS REDIS…"; sleep 1; done
    echo "REDIS IS UP! (Windows PID $redis_pid)"

# 2) macOS (Homebrew)
elif [[ "$OSTYPE" == darwin* ]]; then
    if timeout 2 redis-cli -p 6379 ping >/dev/null 2>&1; then
        echo "REDIS IS ALREADY RUNNING (macOS)."
    elif command -v brew >/dev/null 2>&1; then
        echo "REDIS NOT RUNNING — STARTING REDIS WITH HOMEBREW…"
        brew services start redis
        # Wait until Redis answers
        until timeout 1 redis-cli -p 6379 ping >/dev/null 2>&1; do
            echo "WAITING FOR macOS REDIS…"; sleep 1; done
        echo "REDIS IS UP! (macOS via Homebrew)"
    else
        echo "Homebrew not found."
        exit 1
    fi

# 3) Fallback: check / start Redis inside the default WSL distro
elif timeout 2 wsl -e redis-cli -p 6379 ping >/dev/null 2>&1; then
    echo "REDIS IS ALREADY RUNNING (inside WSL)."

else
    echo "REDIS NOT RUNNING — STARTING REDIS IN WSL…"
    wsl -e bash -c "redis-server --daemonize yes"
    until timeout 1 wsl -e redis-cli -p 6379 ping >/dev/null 2>&1; do
        echo "WAITING FOR WSL REDIS…"; sleep 1; done
    echo "REDIS IS UP! (inside WSL)"
fi

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