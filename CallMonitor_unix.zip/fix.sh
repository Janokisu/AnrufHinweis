#!/bin/bash
sed -i "/path/ s:~:$HOME:g" ./CallMonitor.json
chmod +x ./CallMonitor.py
