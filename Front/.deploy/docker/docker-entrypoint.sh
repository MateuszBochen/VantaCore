#!/bin/bash
set -e


echo 'Front Npm install';
npm install

echo 'npm start';
npm run dev -- --host 0.0.0.0

echo 'Dev null';
tail -f /dev/null

