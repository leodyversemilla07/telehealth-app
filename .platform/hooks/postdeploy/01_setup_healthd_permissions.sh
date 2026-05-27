#!/bin/bash
set -ex

# Set up Enhanced Health monitoring log directories for nginx
# Required by Elastic Beanstalk Docker Compose deployments
NGINX_CONTAINER=$(docker ps --filter "name=proxy" -q 2>/dev/null || true)
if [ -z "$NGINX_CONTAINER" ]; then
  echo "Warning: No proxy container found running, skipping healthd setup"
  exit 0
fi

NGINX_UID=$(docker exec ${NGINX_CONTAINER} id -u nginx 2>/dev/null || echo "101")
NGINX_GID=$(docker exec ${NGINX_CONTAINER} id -g nginx 2>/dev/null || echo "101")

mkdir -p /var/log/nginx/healthd
chown -R ${NGINX_UID}:${NGINX_GID} /var/log/nginx
