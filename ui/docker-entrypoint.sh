#!/bin/sh
set -e

# The endpoint is evaluated in the browser using window.location.origin so it
# automatically adapts to any IP (localhost, Tailscale, remote server).
# nginx proxies /api/ to http://floci:4566/ internally.
cat > /usr/share/nginx/html/config.js <<'EOF'
window.__FLOCI_CONFIG__ = { endpoint: window.location.origin + '/api' };
EOF

exec nginx -g "daemon off;"
