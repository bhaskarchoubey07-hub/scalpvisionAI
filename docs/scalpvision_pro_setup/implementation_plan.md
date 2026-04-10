# Environment Setup and Data Integration Plan

This plan addresses the "download everything" request by ensuring all project dependencies are installed and the database is populated with the required Indian stocks data.

## User Review Required

> [!IMPORTANT]
> - **Python Version**: The current environment uses Python 3.13, which is very new. Some libraries (like `pandas`) are failing to install because they try to build from source. I will attempt to install compatible versions or binary wheels.
> - **Database Seeding**: I will execute the `indian_stocks_seed.sql` script to populate the searchable stock database. This is a large operation that may take a few minutes.

## Proposed Changes

### AI Service Setup

#### [MODIFY] [requirements.txt](file:///c:/Users/bhask/OneDrive/Documents/ChartSniper%20AI/ai-service/requirements.txt)
- Remove strict version pinning for libraries that are failing on Python 3.13 (e.g., `pandas`, `numpy`, `scipy`) to allow `pip` to find compatible versions if they exist.

### Database Seeding

- Execute `infra/db/indian_stocks_seed.sql` against the PostgreSQL database using the `setup-db.js` pattern.

### Verification Plan

- Run `backend/test-db.js` to ensure database connectivity.
- Verify AI service starts with `uvicorn`.
- Check if `npm run dev` starts correctly for frontend and backend.
