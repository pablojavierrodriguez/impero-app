#!/bin/bash
# Clean npm cache and node_modules
rm -rf node_modules
rm -rf package-lock.json
npm cache clean --force
npm install
