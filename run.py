"""
================================================================================
  SIH 2026 - Intelligent Land Record Digitization & Validation System
  Problem Statement ID: SIH26018 | Team: #TECH
================================================================================
Run this file from the project root:
    python run.py            -> Start full application (Frontend + Backend + API)
    python run.py --dev      -> Start Backend (port 8000) & Vite Frontend (port 5173)
    python run.py --test     -> Run the 10-point end-to-end validation test suite
"""

import os
import sys
import time
import argparse
import subprocess
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
TOOLS_NODE_DIR = ROOT_DIR / ".tools" / "node"
if TOOLS_NODE_DIR.exists() and str(TOOLS_NODE_DIR) not in os.environ.get("PATH", ""):
    os.environ["PATH"] = f"{TOOLS_NODE_DIR};{os.environ.get('PATH', '')}"

def print_banner():
    print("=" * 76)
    print("   SMART INDIA HACKATHON 2026 - WORKING PROTOTYPE")
    print("   Project: Intelligent Land Record Digitization & Validation System")
    print("   Problem Statement ID: SIH26018 | Team: #TECH")
    print("=" * 76)
    print("  * Unified Web Application: http://127.0.0.1:8000")
    print("  * Interactive API Docs:    http://127.0.0.1:8000/docs")
    print("  * Demo Officer Login:      officer@landrecords.gov.in / officer123")
    print("  * Demo Admin Login:        admin@landrecords.gov.in / admin123")
    print("=" * 76)
    print("  Press Ctrl+C anytime to stop the server.\n")

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def get_pid_on_port(port: int) -> int | None:
    try:
        output = subprocess.check_output(
            "netstat -ano -p tcp",
            shell=True,
            text=True,
            stderr=subprocess.DEVNULL
        )
        for line in output.splitlines():
            parts = line.strip().split()
            if len(parts) >= 5 and parts[0] == "TCP":
                local_addr = parts[1]
                state = parts[3]
                pid = parts[4]
                if local_addr.endswith(f":{port}") and state == "LISTENING":
                    return int(pid)
    except Exception:
        pass
    return None

def kill_process_on_port(port: int) -> bool:
    pid = get_pid_on_port(port)
    if pid and pid != os.getpid():
        print(f"[INFO] Stopping existing process (PID {pid}) on port {port}...")
        try:
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/PID", str(pid), "/T"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                os.kill(pid, 9)
            for _ in range(10):
                time.sleep(0.3)
                if not is_port_in_use(port):
                    print(f"[INFO] Successfully freed port {port}.")
                    return True
        except Exception as e:
            print(f"[WARNING] Could not terminate process PID {pid}: {e}")
    return not is_port_in_use(port)

def is_server_running(host="127.0.0.1", port=8000):
    import urllib.request
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/docs", timeout=1):
            return True
    except Exception:
        try:
            with urllib.request.urlopen(f"http://{host}:{port}/", timeout=1):
                return True
        except Exception:
            return False

def run_tests(host="127.0.0.1", port=8000):
    print("\n--- Running End-to-End Verification Test Suite ---")
    test_script = BACKEND_DIR / "test_pipeline.py"
    if not test_script.exists():
        print(f"Error: Test file not found at {test_script}")
        return 1

    started_server = False
    server_proc = None

    if not is_server_running(host, port):
        print(f"[INFO] Application server not running on port {port}. Spawning background instance for verification...")
        server_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", host, "--port", str(port)],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        started_server = True
        
        # Wait up to 10 seconds for the server to be ready
        for _ in range(20):
            time.sleep(0.5)
            if is_server_running(host, port):
                print("[INFO] Application server is ready!\n")
                break
        else:
            print("[ERROR] Timed out waiting for server to start.")
            if server_proc:
                if sys.platform == "win32":
                    subprocess.run(["taskkill", "/F", "/PID", str(server_proc.pid), "/T"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    server_proc.terminate()
            return 1
    else:
        print(f"[INFO] Connected to existing server on http://{host}:{port}\n")

    try:
        res = subprocess.run([sys.executable, str(test_script)], cwd=str(BACKEND_DIR))
        return res.returncode
    finally:
        if started_server and server_proc:
            print("[INFO] Cleaning up test server process...")
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/PID", str(server_proc.pid), "/T"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                server_proc.terminate()
                server_proc.wait()


def run_dev(host="127.0.0.1", port=8000, restart=False):
    print_banner()
    print(">>> Launching Development Mode (FastAPI Backend + Vite Frontend) <<<\n")
    
    if restart:
        kill_process_on_port(port)

    if is_port_in_use(port, host):
        pid = get_pid_on_port(port)
        if is_server_running(host, port):
            print(f"[INFO] Backend server is ALREADY running on http://{host}:{port} (PID: {pid})")
            print("[INFO] Use '--restart' to stop the existing instance and start fresh.")
        else:
            print(f"[ERROR] Port {port} is occupied by process PID {pid}.")
            print(f"[INFO] Run with '--restart' or choose another port with '--port <port>'.")
            return 1

    # Check node modules
    node_modules = FRONTEND_DIR / "node_modules"
    if not node_modules.exists():
        print("[INFO] Installing frontend dependencies (npm install)...")
        subprocess.run(["npm", "install"], cwd=str(FRONTEND_DIR), shell=True)

    # Start Vite in background
    print("[INFO] Starting Vite Frontend dev server on http://localhost:5173 ...")
    vite_proc = subprocess.Popen(["npm", "run", "dev"], cwd=str(FRONTEND_DIR), shell=True)

    time.sleep(2)
    webbrowser.open("http://localhost:5173")

    # Start Backend
    print(f"[INFO] Starting FastAPI Backend on http://{host}:{port} ...")
    try:
        if str(BACKEND_DIR) not in sys.path:
            sys.path.insert(0, str(BACKEND_DIR))
        import uvicorn
        uvicorn.run("app.main:app", host=host, port=port, reload=True, app_dir=str(BACKEND_DIR))
    except KeyboardInterrupt:
        print("\nStopping development servers...")
    finally:
        vite_proc.terminate()
    return 0

def run_unified(host="127.0.0.1", port=8000, auto_open=True, restart=False):
    print_banner()
    
    if restart:
        kill_process_on_port(port)

    if is_port_in_use(port, host):
        pid = get_pid_on_port(port)
        if is_server_running(host, port):
            print(f"[INFO] Application server is ALREADY running on http://{host}:{port} (PID: {pid})")
            print(f"  * Web Interface:     http://{host}:{port}")
            print(f"  * API Documentation: http://{host}:{port}/docs")
            print("\n  Commands available:")
            print(f"  * Restart server:    python run.py --restart")
            print(f"  * Stop server:       python run.py --stop")
            print(f"  * Run on other port: python run.py --port {port + 1}")
            if auto_open:
                print(f"\nOpening browser at http://{host}:{port} ...")
                webbrowser.open(f"http://{host}:{port}")
            return 0
        else:
            print(f"[ERROR] Port {port} is already in use by process PID {pid}.")
            print(f"  * To automatically stop it and restart: python run.py --restart")
            print(f"  * Or run on another port:              python run.py --port {port + 1}")
            return 1

    print(f">>> Starting Unified Server (FastAPI + React SPA) on http://{host}:{port} <<<\n")
    
    # Ensure backend directory is on sys.path
    if str(BACKEND_DIR) not in sys.path:
        sys.path.insert(0, str(BACKEND_DIR))
    
    os.chdir(str(BACKEND_DIR))

    if auto_open:
        def open_browser():
            time.sleep(1.5)
            webbrowser.open(f"http://{host}:{port}")
        
        import threading
        threading.Thread(target=open_browser, daemon=True).start()

    import uvicorn
    try:
        uvicorn.run("app.main:app", host=host, port=port, reload=True, app_dir=str(BACKEND_DIR))
    except OSError as e:
        if "10013" in str(e) or "access permissions" in str(e).lower():
            print(f"\n[ERROR] Port {port} access was forbidden (WinError 10013).")
            print(f"Try running with '--restart' to free port {port}, or specify an alternate port with '--port {port + 1}'.")
            return 1
        raise
    return 0

def main():
    parser = argparse.ArgumentParser(description="SIH 2026 Land Records Prototype Runner")
    parser.add_argument("--dev", action="store_true", help="Run in dev mode (FastAPI + Vite dev server concurrently)")
    parser.add_argument("--test", action="store_true", help="Run the automated 10-step verification test suite")
    parser.add_argument("--host", default="127.0.0.1", help="Host address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port number (default: 8000)")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically open the browser")
    parser.add_argument("--restart", action="store_true", help="Stop any existing instance on the port before starting")
    parser.add_argument("--stop", action="store_true", help="Stop any running instance on the specified port and exit")
    parser.add_argument("--status", action="store_true", help="Check if the server is running on the specified port")

    args = parser.parse_args()

    if args.status:
        in_use = is_port_in_use(args.port, args.host)
        running = is_server_running(args.host, args.port)
        pid = get_pid_on_port(args.port)
        print(f"Port {args.port} status:")
        print(f"  * In use:        {in_use} (PID: {pid})")
        print(f"  * App healthy:   {running}")
        return 0

    if args.stop:
        if is_port_in_use(args.port, args.host):
            success = kill_process_on_port(args.port)
            if success:
                print(f"[INFO] Server on port {args.port} stopped successfully.")
                return 0
            else:
                print(f"[ERROR] Could not free port {args.port}.")
                return 1
        else:
            print(f"[INFO] No server is listening on port {args.port}.")
            return 0

    if args.test:
        sys.exit(run_tests(host=args.host, port=args.port))
    elif args.dev:
        sys.exit(run_dev(host=args.host, port=args.port, restart=args.restart))
    else:
        sys.exit(run_unified(host=args.host, port=args.port, auto_open=not args.no_browser, restart=args.restart))

if __name__ == "__main__":
    main()
