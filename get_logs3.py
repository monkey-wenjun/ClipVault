#!/usr/bin/env python3
import urllib.request
import json
import gzip

# Get job logs from GitHub API
# We need to get the jobs first, then get logs for each job

jobs_url = 'https://api.github.com/repos/monkey-wenjun/ClipVault/actions/runs/22757675777/jobs'

req = urllib.request.Request(jobs_url)
req.add_header('Accept', 'application/vnd.github+json')
req.add_header('User-Agent', 'Python')

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode())
    
    # Find the failed build-app jobs
    for job in data.get('jobs', []):
        job_name = job.get('name', '')
        if 'build-app' in job_name and job.get('conclusion') == 'failure':
            print(f"\n{'='*60}")
            print(f"Job: {job_name}")
            print(f"{'='*60}")
            
            # Get logs URL for this job
            logs_url = job.get('logs_url')
            if logs_url:
                print(f"Logs URL: {logs_url}")
                
except Exception as e:
    print(f"Error: {e}")
