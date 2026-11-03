# GeoLedger documentation

How GeoLedger works: architecture, setup, APIs, workflows, and feature guides aligned with [`complete.md`](./complete.md).

## Start here

| Document | Contents |
|---|---|
| [Local setup](./setup.md) | Install, env vars, seeded accounts, Hardhat optional |
| [Demo guide](./demo-guide.md) | End-to-end demonstration of all major workflows |
| [Feature docs](./features/README.md) | Auth, workflows, verification, blockchain/GIS, QR, valuation, dashboards |
| [Requirements](./complete.md) | Full project requirements and acceptance criteria |
| [Implementation status](./implementation-status.md) | What is done vs remaining |

## System reference

| Document | Contents |
|---|---|
| [Architecture](./architecture.md) | Services, data flow, technology choices |
| [REST API](./api.md) | Endpoints, auth, request/response shapes |
| [Workflows](./workflows.md) | Registration, transfer, inheritance, status machine |
| [Data model](./data-model.md) | Collections, statuses, required document types |
| [Smart contract](./smart-contract.md) | `GeoLedger.sol`, events, backend bridge |
| [Frontend](./frontend.md) | Routes, guards, screens, Axios client |

## Feature guides (complete.md §17)

| Feature | Doc |
|---|---|
| Separate Admin/User auth | [features/auth-and-access.md](./features/auth-and-access.md) |
| Three ownership workflows | [features/ownership-workflows.md](./features/ownership-workflows.md) |
| Document verification | [features/document-verification.md](./features/document-verification.md) |
| Blockchain & GIS | [features/blockchain-and-gis.md](./features/blockchain-and-gis.md) |
| QR & public verify | [features/qr-and-public-verify.md](./features/qr-and-public-verify.md) |
| Land valuation | [features/land-valuation.md](./features/land-valuation.md) |
| Dashboards & notifications | [features/dashboards-and-notifications.md](./features/dashboards-and-notifications.md) |

The root [README](../README.md) is a shorter product overview.
