# ResilienceGrid

A responsive, offline-resilient **GitHub Pages demonstration** of a coastal emergency management interface.

> **Safety notice:** This is a front-end demonstration only. It is not connected to emergency services, rescue teams, municipal command centers, real sensors, or a shared backend. SOS and incident reports are stored only in the current browser. Never rely on this project during a real emergency.

## Features

- Citizen portal with demo SOS and incident reporting
- Browser geolocation (permission-based)
- Optional image compression before local storage
- Indexed browser local storage via `localStorage`
- Offline app shell caching with a service worker
- Simulated incident feed, verification queue and dispatch workflow
- Illustrative map with sample markers
- High-contrast and low-data presentation toggles
- Responsive mobile, tablet and desktop layouts
- No build step or package installation required

## Deploy to GitHub Pages

1. Create a repository on GitHub, for example `resiliencegrid`.
2. Upload **all files and folders** from this project. Keep `index.html` in the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then click **Save**.
6. Wait for GitHub Pages to publish. Your site URL will look like `https://YOUR-USERNAME.github.io/resiliencegrid/`.
7. Open the HTTPS site on your phone and choose **Add to Home Screen** to install the PWA.

## Test locally

For service-worker testing, serve the folder over localhost rather than opening `index.html` as a `file://` URL. For example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Data and privacy

- Demo reports are stored in the browser's local storage on the current device.
- A report made on one phone does not appear on another phone or an admin's computer.
- Photos are resized/compressed in the browser and kept in local browser storage.
- Clearing browser site data can delete saved demo reports.
- The map is an illustrative graphic, not a live GIS layer. The interface does not download live map tiles.
- The confidence value and duplicate detection are simple client-side demonstration heuristics, not AI or a verified geospatial pipeline.

## Suggested next production steps

A real emergency deployment would require a secure backend, authentication and role permissions, shared real-time data, server-side validation, audit logs, encrypted transport, tested GIS data, official alert integrations, accessibility testing, incident-response governance, and operational agreements with authorized responders. Do not use this static demo as a life-safety system.
