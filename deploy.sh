#!/bin/bash
set -e

EC2_HOST="ec2-user@44.249.119.26"
EC2_KEY="$HOME/Downloads/yourstockpicker-jobs.pem"

echo "Deploying Chowk backend to EC2..."

ssh -i "$EC2_KEY" "$EC2_HOST" << 'EOF'
  set -e
  cd /opt/chowk
  git pull
  cd backend
  source venv/bin/activate
  pip install -r requirements.txt -q
  sudo systemctl restart chowk
  sleep 2
  sudo systemctl is-active chowk
EOF

echo "Checking health..."
sleep 3
curl -sf https://chowk.yourstockpicker.com/health && echo " — deploy successful"
