# Land valuation module

Requirement source: `complete.md` §7.

## Purpose

Provide a **system-generated estimate** of land value for informational use. Estimates are explicitly **not** official government guideline values.

## Estimate API

`POST /valuation/estimate` (authenticated)

```json
{
  "area": 2500,
  "land_type": "Residential",
  "location_category": "urban",
  "district": "Mysuru",
  "survey_number": "SN-DEMO-001"
}
```

If `survey_number` is provided, missing area/district/land type may be filled from the property record.

### Formula

```
estimated_value = area × base_rate_per_sqft × location_multiplier × district_multiplier
```

Default factors (INR):

| Land type | Base ₹ / sq ft |
|---|---|
| Residential | 2500 |
| Commercial | 4500 |
| Agricultural | 800 |
| Industrial | 3200 |
| Other | 1500 |

| Location category | Multiplier |
|---|---|
| urban | 1.35 |
| semi_urban | 1.1 |
| rural | 0.85 |

District multipliers include examples such as Mysuru `1.15`, Bengaluru `1.6`, default `1.0`.

Response always includes:

- `estimated_value`, `currency`, `factors`
- `disclaimer`
- `is_official_valuation: false`

## Admin parameters

| Endpoint | Access |
|---|---|
| `GET /valuation/params` | Authenticated |
| `PUT /valuation/params` | Admin |

Admins can adjust base rates and multipliers from the Land Valuation screen (`/valuation`).

## Frontend

Route: `/valuation`  
Users run estimates; admins also see the parameter editor.
