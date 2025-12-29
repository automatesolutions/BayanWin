# How to Deploy InstantDB Schema

## The Problem
The InstantDB API returns 200 OK but empty responses because the entities don't exist in the deployed schema yet.

## The Solution
You need to deploy the schema by running the Next.js app. InstantDB automatically syncs the schema when the app connects.

## Steps to Deploy

### 1. Navigate to the Next.js app directory
```bash
cd lof-v2-db
```

### 2. Install dependencies (if not already done)
```bash
npm install
```

### 3. Set up environment variable
Make sure you have a `.env.local` file with:
```
NEXT_PUBLIC_INSTANT_APP_ID=beb7efd4-c8f7-4157-ad5a-80b2f55f4f87
```

### 4. Run the Next.js development server
```bash
npm run dev
```

This will:
- Connect to InstantDB
- Automatically sync the schema (entities will be created)
- Sync the permissions

### 5. Wait for sync
Once the app starts, InstantDB will sync the schema. You should see the entities appear in the InstantDB dashboard.

### 6. Verify deployment
After the app runs for a few seconds, test the API:
```bash
cd ../backend
python test_instantdb_save.py
```

You should now see:
- Response contains data (not empty)
- Query returns saved records

## What Was Fixed

1. ✅ **Schema Updated**: Added all lottery result and prediction entities to `lof-v2-db/src/instant.schema.ts`
2. ✅ **Permissions Added**: Added permissions for all entities in `lof-v2-db/src/instant.perms.ts`
3. ✅ **DB Initialization**: Updated `lof-v2-db/src/lib/db.ts` to include permissions

## After Deployment

Once the schema is deployed:
- ✅ The scraper will work
- ✅ Data will be saved to InstantDB
- ✅ You can query the data via the API

## Troubleshooting

If it still doesn't work after deploying:
1. Check the InstantDB dashboard to see if entities appear
2. Verify the app ID is correct
3. Check browser console for any errors
4. Make sure the Next.js app is actually running and connected

