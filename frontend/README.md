# GeoLedger frontend

React 19 + TypeScript SPA (Vite). The running app is `src/app/` — see [../docs/frontend.md](../docs/frontend.md) and [../docs/setup.md](../docs/setup.md).

```bash
npm install
npm run dev:network
```

To open the development site on a phone connected to the same Wi-Fi:

1. Start the Flask API as described in the project setup guide.
2. Run `npm run dev:network` in this directory. It uses port `5173`; it will
   report an error rather than silently switching ports if that port is busy.
3. Find this computer's local IPv4 address (`ipconfig` on Windows), then open
   `http://<computer-ip>:5173` on your phone. Allow Node.js through the Windows
   Firewall if prompted.
   If Windows Firewall blocks the connection, open PowerShell as Administrator
   and add a rule limited to devices on the local subnet:

   ```powershell
   New-NetFirewallRule -DisplayName "GeoLedger Vite LAN" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -RemoteAddress LocalSubnet -Profile Private,Public
   ```

The development server proxies API requests to `http://127.0.0.1:5000`, so the
phone does not need to access the API port directly. Remove any
`VITE_API_BASE_URL` override in `frontend/.env` when using this setup. For a
separately hosted API, set `VITE_API_BASE_URL` to an address reachable from the
phone.
