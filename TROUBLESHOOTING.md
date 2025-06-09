# Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Database Issues

#### Issue: "DATABASE_URL must be set" Error
```bash
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

**Solution:**
1. Ensure PostgreSQL database is running
2. Check environment variables are properly set
3. Verify DATABASE_URL format: `postgresql://user:password@host:port/database`

#### Issue: Database Tables Don't Exist
```bash
Error: relation "users" does not exist
```

**Solution:**
```bash
npm run db:push
```
This creates all required tables from the schema.

#### Issue: Database Connection Timeouts
**Solution:**
1. Check network connectivity to database
2. Verify database server is running
3. Check connection pool settings in `server/db.ts`

### Goal System Issues

#### Issue: No Active Goal Found
**Symptoms:**
- Home page shows "No active goal"
- Click button is disabled
- Goal switching doesn't work

**Root Cause:** No goal has `isActive: true` in database

**Solution:**
```sql
-- Check current goals
SELECT id, name, isActive FROM goals WHERE playerId = 1;

-- Set a goal as active
UPDATE goals SET isActive = true WHERE id = YOUR_GOAL_ID AND playerId = 1;
UPDATE goals SET isActive = false WHERE id != YOUR_GOAL_ID AND playerId = 1;
```

**Code Fix:**
Ensure goal activation logic in `server/routes-goals.ts` properly updates the active flag.

#### Issue: Click Tracking Not Working
**Symptoms:**
- Clicks not incrementing
- Statistics not updating
- Database errors on click

**Debug Steps:**
1. Check browser console for API errors
2. Verify active goal exists
3. Check database connectivity
4. Review server logs for SQL errors

**Common Fixes:**
- Ensure goal is marked as active
- Verify date format in click records (YYYY-MM-DD)
- Check for null value handling in click operations

### Team System Issues

#### Issue: "Invite Not Found" Error
**Symptoms:**
- Invite links return 404
- Team join flow fails
- Invite codes appear invalid

**Root Cause:** Invite codes may be expired or deleted

**Solution:**
```sql
-- Check invite status
SELECT * FROM team_invites WHERE invite_code = 'YOUR_CODE';

-- Check expiry
SELECT invite_code, status, expires_at FROM team_invites 
WHERE expires_at > NOW() AND status = 'pending';
```

#### Issue: Team Deletion Fails
**Symptoms:**
- Delete button doesn't work
- Foreign key constraint errors
- Team still appears after deletion

**Solution:**
The delete operation should cascade properly. Check:
1. User is team owner
2. Foreign key constraints are properly defined
3. Cascade deletes are working

```sql
-- Manual cleanup if needed
DELETE FROM team_invites WHERE team_id = YOUR_TEAM_ID;
DELETE FROM team_members WHERE team_id = YOUR_TEAM_ID;
DELETE FROM teams WHERE id = YOUR_TEAM_ID;
```

### Frontend Issues

#### Issue: TypeScript Errors
**Common Errors:**
- `Property 'map' does not exist on type '{}'`
- `Cannot find module '@/pages/join-team'`
- `Property 'id' does not exist on type '{}'`

**Solutions:**
1. **Type Assertion Issues:**
```typescript
// Instead of: data.map(...)
// Use: data?.map(...) or (data as Array<Type>).map(...)
```

2. **Import Path Issues:**
```typescript
// Check file exists and has proper export
// Verify tsconfig.json path mapping
```

3. **Query Data Types:**
```typescript
// Properly type React Query responses
const { data: goals } = useQuery<Goal[]>({
  queryKey: ['/api/goals'],
});
```

#### Issue: React Query Cache Issues
**Symptoms:**
- Stale data displayed
- Updates not reflecting
- Infinite loading states

**Solutions:**
```typescript
// Force refetch
queryClient.invalidateQueries({ queryKey: ['/api/goals'] });

// Clear specific cache
queryClient.removeQueries({ queryKey: ['/api/goals/active'] });

// Reset all cache
queryClient.clear();
```

#### Issue: Routing Problems
**Symptoms:**
- 404 errors on page navigation
- Back button not working
- URL parameters not updating

**Solution:**
Check wouter routing setup in `App.tsx`:
```typescript
// Ensure all routes are properly defined
<Route path="/join/:code" component={JoinTeam} />
```

### API Issues

#### Issue: CORS Errors
**Symptoms:**
- API calls fail from frontend
- "Access-Control-Allow-Origin" errors
- Network requests blocked

**Solution:**
Ensure Express server has proper CORS configuration (already handled by Vite proxy in development).

#### Issue: 401 Unauthorized Errors
**Symptoms:**
- All API calls return 401
- User appears logged out
- Authentication failures

**Root Cause:** Currently using hardcoded userId = 1

**Debug:**
Check that all API routes use consistent user identification.

#### Issue: Request Validation Errors
**Symptoms:**
- API returns 400 with validation errors
- Zod schema validation failures
- Type mismatches

**Solution:**
1. Check request payload matches expected schema
2. Verify Zod schema definitions in `shared/schema.ts`
3. Ensure frontend form validation matches backend expectations

### Performance Issues

#### Issue: Slow Database Queries
**Symptoms:**
- Long API response times
- Database timeouts
- High CPU usage

**Solutions:**
1. **Add Database Indexes:**
```sql
CREATE INDEX idx_goals_player_active ON goals(player_id, is_active);
CREATE INDEX idx_click_records_date ON click_records(date);
```

2. **Optimize Queries:**
- Reduce N+1 queries
- Use proper JOIN operations
- Limit result sets

#### Issue: React Query Over-fetching
**Symptoms:**
- Too many API calls
- Network tab showing duplicate requests
- High bandwidth usage

**Solutions:**
```typescript
// Increase stale time
useQuery({
  queryKey: ['/api/goals'],
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Reduce refetch frequency
useQuery({
  queryKey: ['/api/goals'],
  refetchOnWindowFocus: false,
});
```

### Development Issues

#### Issue: Hot Reload Not Working
**Symptoms:**
- Changes not reflecting
- Need to manually refresh
- Vite errors in console

**Solutions:**
1. Check Vite configuration
2. Verify file watching permissions
3. Restart development server

#### Issue: TypeScript Compilation Errors
**Symptoms:**
- Build failures
- Type checking errors
- Missing dependencies

**Solutions:**
1. Update dependencies: `npm update`
2. Clear TypeScript cache: `rm -rf node_modules/.cache`
3. Check tsconfig.json configuration

## 🔧 Debug Techniques

### Database Debugging

1. **Direct Database Access:**
```bash
# Using Drizzle Studio (recommended)
npm run db:studio

# Or direct PostgreSQL access
psql $DATABASE_URL
```

2. **Query Logging:**
Add to `server/db.ts`:
```typescript
export const db = drizzle({ client: pool, schema, logger: true });
```

### API Debugging

1. **Server-Side Logging:**
```typescript
console.log("=== API DEBUG ===", {
  endpoint: req.path,
  method: req.method,
  body: req.body,
  params: req.params
});
```

2. **Client-Side Network Tab:**
- Check request/response in browser DevTools
- Verify request headers and payload
- Monitor response status codes

### React Debugging

1. **React Query DevTools:**
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to App.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

2. **State Debugging:**
```typescript
// Log query state
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/goals'],
  onSuccess: (data) => console.log('Query success:', data),
  onError: (error) => console.log('Query error:', error),
});
```

## 🚀 Quick Fixes

### Reset Application State
```bash
# Clear all caches and restart
rm -rf node_modules/.cache
npm run dev
```

### Reset Database
```bash
# WARNING: This deletes all data
npm run db:push
```

### Force React Query Refresh
```javascript
// In browser console
window.location.reload();
```

### Check System Health
```bash
# Verify all services
curl http://localhost:5000/api/goals
curl http://localhost:5000/api/player/profile
```

## 📋 Health Checklist

Before reporting issues, verify:

- [ ] Database is running and accessible
- [ ] Environment variables are set
- [ ] Dependencies are installed (`npm install`)
- [ ] Database schema is up to date (`npm run db:push`)
- [ ] No TypeScript compilation errors
- [ ] Browser console shows no errors
- [ ] Network requests are successful (200 status)
- [ ] At least one goal exists and is active

## 🆘 Getting Help

### Information to Provide

When reporting issues, include:

1. **Error Messages:** Exact error text from console
2. **Steps to Reproduce:** What actions led to the issue
3. **Environment:** Browser, Node.js version, OS
4. **Database State:** Relevant query results
5. **Network Activity:** API request/response details

### Log Locations

- **Server Logs:** Console output where `npm run dev` is running
- **Client Logs:** Browser DevTools console
- **Database Logs:** Check PostgreSQL logs if available
- **Network Logs:** Browser DevTools Network tab

This troubleshooting guide covers the most common issues encountered when developing and maintaining the basketball productivity application.