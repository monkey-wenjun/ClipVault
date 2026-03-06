#!/usr/bin/env python3
import urllib.request
import json

url = 'https://api.github.com/repos/monkey-wenjun/ClipVault/actions/runs/22757675777/jobs'
req = urllib.request.Request(url)
req.add_header('Accept', 'application/vnd.github+json')

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode())
    
    for job in data.get('jobs', []):
        print(f"Job: {job.get('name')}")
        print(f"Status: {job.get('status')}")
        print(f"Conclusion: {job.get('conclusion')}")
        print("Steps:")
        for step in job.get('steps', []):
            name = step.get('name')
            conclusion = step.get('conclusion')
            print(f"  - {name}: {conclusion}")
        print()
except Exception as e:
    print(f"Error: {e}")
