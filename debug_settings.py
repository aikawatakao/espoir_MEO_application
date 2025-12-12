import urllib.request
import urllib.error
import json

url = 'http://localhost:3000/api/settings'

try:
    response = urllib.request.urlopen(url)
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
