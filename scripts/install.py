#!/usr/bin/env python3
import subprocess
import sys
import os

os.chdir('/vercel/share/v0-project')

print("[v0] Starting clean npm install with legacy-peer-deps...")

try:
    # Run npm install with legacy-peer-deps flag
    result = subprocess.run(
        ['npm', 'install', '--legacy-peer-deps'],
        capture_output=True,
        text=True,
        timeout=300
    )
    
    print("[v0] stdout:", result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
    print("[v0] stderr:", result.stderr[-500:] if len(result.stderr) > 500 else result.stderr)
    print("[v0] returncode:", result.returncode)
    
    if result.returncode == 0:
        print("[v0] SUCCESS: npm install completed successfully!")
        sys.exit(0)
    else:
        print("[v0] FAILED: npm install exited with code", result.returncode)
        sys.exit(1)
        
except Exception as e:
    print(f"[v0] ERROR: {str(e)}")
    sys.exit(1)
