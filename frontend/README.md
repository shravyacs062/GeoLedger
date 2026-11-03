# GeoLedger frontend

React 19 + TypeScript SPA (Vite). The running app is `src/app/` — see [../docs/frontend.md](../docs/frontend.md) and [../docs/setup.md](../docs/setup.md).

```bash
npm install
npm run dev      # http://localhost:5173
```

Optional `frontend/.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:5000
```

The Flask API must be running on that origin. Login is a simulated wallet connect.
