# Floci UI — Functional Requirements

This document describes the functional requirements of the Floci Web UI for use by QA agents and testers.

---

## 1. General / Configuration

### REQ-CFG-01: Runtime endpoint configuration
The UI must read the Floci emulator endpoint from `window.__FLOCI_CONFIG__.endpoint` when running inside Docker. No Docker image rebuild should be required to change the endpoint.

### REQ-CFG-02: Dev local fallback
When running outside Docker (local dev), the UI must read the endpoint from the `VITE_FLOCI_ENDPOINT` environment variable defined in `.env` or `.env.local`.

### REQ-CFG-03: Default fallback
If neither runtime config nor env var is present, the UI must default to `http://localhost:4566`.

### REQ-CFG-04: Active endpoint visible
The current endpoint must be visible in the page header at all times.

---

## 2. Layout

### REQ-LAY-01: Navigation sidebar
A persistent sidebar must be present with links to: Dashboard, S3, DynamoDB.

### REQ-LAY-02: Active route highlighted
The sidebar must highlight the currently active route.

### REQ-LAY-03: Responsive layout
The layout must not break on screen widths ≥ 1024px. Smaller widths are not in scope for v1.

---

## 3. Dashboard

### REQ-DASH-01: Emulator health status
The dashboard must display the emulator health status (online/offline) by calling `GET /_floci/health`. The status must update automatically every 10 seconds.

### REQ-DASH-02: Offline error state
If the health endpoint is unreachable, the dashboard must display a visible error alert with the configured endpoint URL.

### REQ-DASH-03: S3 bucket count
The dashboard must display the total number of S3 buckets.

### REQ-DASH-04: DynamoDB table count
The dashboard must display the total number of DynamoDB tables.

### REQ-DASH-05: Emulator version
The dashboard must display the emulator version when available in the health response.

### REQ-DASH-06: Services list
The dashboard must display the full list of services with their enabled/disabled status. The count of enabled services must be shown.

---

## 4. S3 Browser

### REQ-S3-01: List buckets
The S3 page must list all buckets with their names and creation dates.

### REQ-S3-02: Navigate into bucket
Clicking a bucket must navigate into it and display the objects at the root prefix.

### REQ-S3-03: Folder simulation
Objects with a common prefix separated by `/` must appear as virtual folders. Clicking a folder must navigate into it, updating the object list and breadcrumb.

### REQ-S3-04: Breadcrumb navigation
A breadcrumb must show the current path (`bucket / folder / subfolder`). Clicking any breadcrumb segment must navigate back to that prefix.

### REQ-S3-05: Return to bucket list
A "Back" button must be visible when inside a bucket and must return to the bucket list.

### REQ-S3-06: Object metadata
The object list must show: key name (relative to current prefix), size (human-readable), and last modified date.

### REQ-S3-07: Download object
Each object must have a download button. Clicking it must trigger a browser file download for that object.

### REQ-S3-08: Upload via button
A button must allow selecting files to upload to the current bucket and prefix.

### REQ-S3-09: Upload via drag-and-drop
A drag-and-drop zone must be visible inside a bucket view. Dropping files must upload them to the current bucket and prefix.

### REQ-S3-10: Upload success feedback
After a successful upload, a success message must appear and the object list must refresh.

### REQ-S3-11: Upload failure feedback
If an upload fails, an error message must appear.

### REQ-S3-12: Reload
A reload button must re-fetch the current list (buckets or objects).

---

### Edge Cases — S3

| Case | Expected behavior |
|---|---|
| Bucket with zero objects | Object list shows "Empty folder" empty state |
| Object key with deeply nested path (`a/b/c/d/file.txt`) | Navigating folder by folder reveals the file at the deepest level |
| Object key with no `/` | Appears as a file at the root of the bucket |
| Upload file > 100 MB | Upload proceeds; no artificial size limit in the UI |
| Two files with same name uploaded | Second upload overwrites the first (S3 behavior); object list reflects the latest |
| Bucket name with hyphens and numbers | Displays and functions correctly |
| Empty bucket list | Bucket list shows "No buckets found" empty state |

---

## 5. DynamoDB Browser

### REQ-DDB-01: List tables
The DynamoDB page must list all tables with their names, statuses, item counts, and key schema (partition key and sort key).

### REQ-DDB-02: Navigate into table
Clicking a table must open a scan view showing the table's items.

### REQ-DDB-03: Return to table list
A "Back" button must be visible when inside a table and must return to the table list.

### REQ-DDB-04: Item count in header
When inside a table, the current number of scanned items must be displayed.

### REQ-DDB-05: Dynamic columns
The item table must generate columns dynamically from the attribute keys present in the scanned results.

### REQ-DDB-06: Attribute rendering
Scalar attributes (String, Number, Boolean, Null) must be displayed inline. Complex attributes (Map, List) must show a truncated preview and allow clicking to view the full value.

### REQ-DDB-07: Full item detail
Clicking a row or a complex attribute must open a side drawer with the full item rendered as formatted JSON.

### REQ-DDB-08: FilterExpression
An input field must allow entering an optional DynamoDB `FilterExpression`. Pressing Enter or clicking "Scan" must re-execute the scan with the expression.

### REQ-DDB-09: Clear filter
Clearing the FilterExpression input must re-execute an unfiltered scan.

### REQ-DDB-10: Invalid FilterExpression error
If the FilterExpression is invalid, an error alert must appear. The previous results must remain visible.

### REQ-DDB-11: Pagination
When a table has more than 25 items, results must be paginated. The user must be able to change the page size.

### REQ-DDB-12: Reload
A reload button must re-fetch the current view (table list or items).

---

### Edge Cases — DynamoDB

| Case | Expected behavior |
|---|---|
| Table with zero items | Item list shows "No items" empty state |
| Table with > 100 items | Items paginated; all items accessible via page navigation |
| Item with only partition key (no other attributes) | One column visible for the key; row is clickable |
| Item with deeply nested Map attribute | Preview shows truncated JSON; full value in drawer |
| Item with List attribute containing Maps | Renders as complex type, full value in drawer |
| FilterExpression with syntax error | Error alert shown, no crash |
| Table in non-ACTIVE status | Status tag shows correct state (e.g., CREATING) |
| Empty table list | Table list shows "No tables found" empty state |

---

## 6. Error Handling

### REQ-ERR-01: Emulator offline
When the emulator is not reachable, any data-loading operation must show an error state — never a blank screen or a crash.

### REQ-ERR-02: 4xx/5xx from emulator
HTTP errors from the emulator must show a user-visible error message.

### REQ-ERR-03: No crash on empty data
All pages must render correctly when the emulator returns empty lists.

---

## 7. Docker

### REQ-DOCK-01: Docker build
Running `docker compose up --build` must produce a working UI at `http://localhost:8080`.

### REQ-DOCK-02: Endpoint override without rebuild
Changing `FLOCI_ENDPOINT` in `docker-compose.yml` and restarting the container (without rebuilding the image) must change the endpoint the UI connects to.

### REQ-DOCK-03: UI reaches emulator inside Docker network
With the default `docker-compose.yml`, the UI container must successfully reach the Floci emulator via `http://floci:4566`.

---

## 8. Out of Scope (v1)

- Authentication / authorization (no login required)
- Creating or deleting buckets or tables from the UI
- SQS, SNS, Lambda, Cognito, or other services beyond S3 and DynamoDB
- Mobile / small screen layouts
- Dark mode
- Real-time push updates (WebSocket / SSE)
