# 🚀 Dynamic User Limits Management System

## Overview
This system allows you to dynamically control user limits through Supabase and automatically enforces those limits by deleting assistants from VAPI when exceeded.

## ✅ Features Implemented

### 🎯 **Dynamic Limit Control**
- **Edit limits directly in Supabase UI** - Just change `max_assistants` or `max_minutes_total` in the `profiles` table
- **Real-time enforcement** - Limits are enforced automatically when changed
- **Automatic cleanup** - Excess assistants are deleted from both database and VAPI

### 📊 **Admin Monitoring Dashboard**
- **Comprehensive view**: `public.admin_user_monitoring` 
- **Status tracking**: NORMAL, WARNING, OVER_LIMIT, AT_ASSISTANT_LIMIT, SUSPENDED
- **Usage calculations**: Percentage used, remaining minutes, assistant counts
- **Quick actions**: Easy identification of users needing intervention

### 🔧 **Admin Functions**
- `admin_update_user_limits()` - Update limits with automatic enforcement
- `admin_reset_user_usage()` - Reset user usage to 0
- `enforce_limits_with_vapi_cleanup()` - Run comprehensive enforcement

### 📈 **Audit Trail**
- **Full history**: Every limit change is logged in `user_limits_history`
- **Admin tracking**: Who changed what and when
- **Reason logging**: Why limits were changed

## 🎮 How to Use

### Method 1: Direct Supabase UI Changes
1. Go to Supabase → Table Editor → `profiles`
2. Find the user and edit their limits:
   - `max_assistants`: Change from 3 to any number (e.g., 5, 1, 10)
   - `max_minutes_total`: Change from 10 to any number (e.g., 20, 5, 100)
3. **System automatically enforces** when limits are exceeded

### Method 2: Admin API Endpoints

#### Update User Limits
```bash
POST /api/admin/user-limits
{
  "userId": "user-uuid",
  "maxAssistants": 5,
  "maxMinutes": 20,
  "adminEmail": "admin@company.com",
  "reason": "Premium upgrade",
  "suspendUser": false
}
```

#### Reset User Usage
```bash
PUT /api/admin/user-limits/reset
{
  "userId": "user-uuid",
  "adminEmail": "admin@company.com",
  "reason": "Customer request"
}
```

#### Enforce All Limits
```bash
POST /api/admin/enforce-limits
{
  "adminEmail": "admin@company.com"
}
```

### Method 3: Direct SQL Functions
```sql
-- Update limits for a user
SELECT public.admin_update_user_limits(
    'user-uuid'::UUID,
    5, -- new assistant limit
    20, -- new minutes limit  
    'admin@company.com',
    'Premium upgrade',
    false -- suspend user
);

-- Reset user usage
SELECT public.admin_reset_user_usage(
    'user-uuid'::UUID,
    'admin@company.com',
    'Monthly reset'
);

-- Run enforcement across all users
SELECT public.enforce_limits_with_vapi_cleanup();
```

## 🔍 Monitoring Queries

### Check All Users Status
```sql
SELECT 
    email,
    account_status,
    max_assistants,
    max_minutes_total,
    current_usage_minutes,
    active_assistants,
    usage_percentage
FROM public.admin_user_monitoring;
```

### Find Users Over Limits
```sql
SELECT * FROM public.admin_user_monitoring 
WHERE account_status IN ('OVER_LIMIT', 'AT_ASSISTANT_LIMIT', 'SUSPENDED');
```

### View Limit Change History
```sql
SELECT 
    ulh.*,
    p.email 
FROM public.user_limits_history ulh
JOIN public.profiles p ON ulh.user_id = p.id
ORDER BY ulh.created_at DESC;
```

## ⚡ Real-time Enforcement

The system automatically enforces limits in these scenarios:

1. **When you change limits in Supabase UI**
2. **When user usage is updated after calls**
3. **When running manual enforcement**
4. **When assistants are created (future enhancement)**

## 🚨 VAPI Integration

When assistants are deleted due to limit enforcement:
1. **Database**: Assistant marked as `expired` with `deletion_reason`
2. **VAPI API**: Automatic DELETE request sent to VAPI
3. **Logging**: Full audit trail in `cleanup_jobs` table

## 📱 React Admin Component

Use the `UserLimitsManager` component for a complete admin interface:
```tsx
import { UserLimitsManager } from '@/components/admin/UserLimitsManager';

<UserLimitsManager />
```

## 🔒 Security

- **Service role access** for admin functions
- **RLS policies** protect user data
- **Audit logging** for compliance
- **Admin email tracking** for accountability

## 🎯 Example Scenarios

### Upgrade User to Premium
```sql
-- Give user 10 assistants and 100 minutes
SELECT public.admin_update_user_limits(
    'user-uuid'::UUID, 10, 100, 
    'admin@company.com', 'Upgraded to Premium plan', false
);
```

### Downgrade User (Auto-deletes excess)
```sql
-- Reduce to 1 assistant and 5 minutes (excess deleted automatically)
SELECT public.admin_update_user_limits(
    'user-uuid'::UUID, 1, 5, 
    'admin@company.com', 'Downgraded to free tier', false
);
```

### Suspend Problem User
```sql
-- Suspend user (all assistants deleted automatically)
SELECT public.admin_update_user_limits(
    'user-uuid'::UUID, NULL, NULL, 
    'admin@company.com', 'Terms violation', true
);
```

### Monthly Usage Reset
```sql
-- Reset all users' usage for new month
UPDATE public.profiles SET current_usage_minutes = 0;
```

## 🎉 Summary

You now have **complete control** over user limits with:
- ✅ **Dynamic editing** through Supabase UI
- ✅ **Automatic enforcement** with VAPI deletion
- ✅ **Real-time monitoring** dashboard
- ✅ **Full audit trail** for compliance
- ✅ **API endpoints** for integration
- ✅ **React components** for admin UI

Just change the numbers in Supabase and the system handles everything automatically! 🚀