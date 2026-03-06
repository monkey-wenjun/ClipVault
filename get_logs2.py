#!/usr/bin/env python3
import urllib.request
import json
import zipfile
import io

# Get logs download URL
url = 'https://api.github.com/repos/monkey-wenjun/ClipVault/actions/runs/22757675777/logs'
req = urllib.request.Request(url)
req.add_header('Accept', 'application/vnd.github+json')
req.method = 'GET'

try:
    response = urllib.request.urlopen(req)
    # This will return a redirect URL to download logs
    print(f"Status: {response.status}")
    print(f"URL: {response.geturl()}")
    data = response.read()
    print(f"Response length: {len(data)}")
    print(data[:2000])
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Reason: {e.reason}")
    print(f"Response: {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")
