# Astro App Log Location Guide

## Where to Find Logs

The Astro app (`cosmic-crater`) runs as a Node.js server using the `@astrojs/node` adapter. Here's where to find the logs:

### 1. If Running Under PM2

If the Astro app is managed by PM2 (like the RivCo server), check PM2 logs:

```bash
# List all PM2 processes
pm2 list

# View logs for the Astro app (replace 'app-name' with actual name)
pm2 logs app-name

# View only error logs
pm2 logs app-name --err

# View only output logs
pm2 logs app-name --out

# View last 100 lines
pm2 logs app-name --lines 100
```

PM2 logs are typically located at:
- `~/.pm2/logs/` (user's home directory)
- Look for files like: `app-name-out.log` and `app-name-error.log`

### 2. If Running as a Systemd Service

Check systemd journal:
```bash
# View logs for the service (replace 'service-name' with actual name)
journalctl -u service-name -f

# View last 100 lines
journalctl -u service-name -n 100
```

### 3. If Running Directly (Node process)

If running directly with `node dist/server/entry.mjs` or similar:
- Logs go to stdout/stderr
- Check the terminal where it's running
- If running in background, check where stdout/stderr are redirected

### 4. If Running Behind a Reverse Proxy (Nginx/Apache)

The reverse proxy might have its own logs, but the Astro app logs would still be in one of the above locations.

## Finding the Process

To find where the Astro app is running:

```bash
# Find Node processes
ps aux | grep node

# Find processes listening on specific ports (Astro default is often 4321 or 3000)
lsof -i :4321
lsof -i :3000

# Check all listening ports
netstat -tulpn | grep LISTEN
# or
ss -tulpn | grep LISTEN
```

## Log Messages to Look For

With the new logging added, you should see messages like:

**Server-side logs:**
- `[Places Autocomplete] Google Maps API key not configured`
- `[Places Autocomplete] Missing required parameter: input`
- `[Places Autocomplete] Google API error response:`
- `[Places Autocomplete] Error proxying Google Places Autocomplete API:`

**Client-side logs (Browser Console):**
- `[PlaceAutocomplete] Non-OK response status:`
- `[PlaceAutocomplete] Place details non-OK response:`
- `Error fetching autocomplete suggestions:`

## Quick Check Commands

```bash
# Check if PM2 is managing the Astro app
pm2 list | grep -i astro
pm2 list | grep -i cosmic

# Check PM2 logs for any mentions of "Places Autocomplete"
pm2 logs --lines 200 | grep -i "places autocomplete"

# Check system logs
journalctl -xe | grep -i "places autocomplete"
```

## Adding More Visibility

If you want to ensure logs are written to a file, you can:
1. Redirect stdout/stderr when starting the process
2. Use a logging library (winston, pino, etc.)
3. Configure PM2 to log to specific files

