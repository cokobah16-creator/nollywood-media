# Admin Dashboard Guide

A complete guide to using the admin CMS for managing your Nollywood streaming platform.

## Accessing the Admin Dashboard

### For First-Time Setup
1. Sign up for an account at your site
2. Get your User ID from Supabase Dashboard → Authentication → Users
3. Run this SQL in Supabase SQL Editor:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('your-user-id-here', 'admin');
   ```
4. Sign out and sign back in
5. Click your profile icon → "Admin Dashboard"

### For Returning Admins
1. Sign in to your account
2. Click your profile icon in the top right
3. Select "Admin Dashboard"

## Dashboard Overview

The admin dashboard provides:
- **Total Films**: Count of all films in your catalog
- **Total Users**: Number of registered users
- **Total Views**: Aggregate view count across all content
- **Recent Films**: Films added in the last 30 days

Quick action cards let you:
- Add new films
- Manage users
- View detailed analytics

## Managing Films

### Viewing All Films

Navigate to **Films** in the sidebar to see:
- Complete list of all films
- Search bar to filter by title or genre
- Table showing:
  - Title
  - Genre
  - Release year
  - Runtime
  - Rating
  - View count
  - Action buttons (Edit/Delete)

### Adding a New Film

1. Click **"Add Film"** button (top right)
2. Fill in required fields (marked with *):
   - **Film ID**: Unique identifier (e.g., "1", "MLN-001")
   - **Title**: Full film title
   - **Logline**: Short, compelling description
   - **Genre**: Select from dropdown
   - **Release Year**: 4-digit year
   - **Runtime**: Duration in minutes
   - **Rating**: Content rating (G, PG, PG-13, R, NC-17)
   - **Region**: Geographic setting
   - **Studio Label**: Production company
   - **Audio Languages**: Comma-separated (e.g., "English, Igbo, Yoruba")
   - **Subtitle Languages**: Comma-separated (e.g., "English, French")

3. Optional fields:
   - **Poster URL**: Link to poster image
   - **Synopsis**: Detailed plot description
   - **Director**: Director's name
   - **Cast Members**: Comma-separated actor names
   - **Tags**: Comma-separated keywords

4. Click **"Save Film"**

### Editing a Film

1. Find the film in the list
2. Click the **Edit icon** (pencil) in the Actions column
3. Modify any fields
4. Click **"Save Film"**

**Note**: Film ID cannot be changed after creation

### Deleting a Film

1. Find the film in the list
2. Click the **Delete icon** (trash) in the Actions column
3. Confirm deletion in the popup
4. Film is permanently removed

**Warning**: This action cannot be undone and will also remove associated streams and captions.

## Managing Users

Navigate to **Users** in the sidebar to:
- View all registered users
- See user emails and current roles
- View join dates
- Change user roles

### Changing User Roles

1. Find the user in the list
2. Click the role dropdown in the Actions column
3. Select new role:
   - **User**: Regular user (default)
   - **Admin**: Full admin access
   - **Super Admin**: Reserved for platform owners

4. Role updates immediately

### User Roles Explained

- **User**: Can browse, watch, and manage personal watchlist
- **Admin**: Can manage films, users, and view analytics
- **Super Admin**: Full platform control (reserved for platform owners)

## Analytics

Navigate to **Analytics** to view:
- Platform-wide statistics
- User engagement metrics
- Content performance
- Trending films

**Status**: Coming in future update

## Settings

Navigate to **Settings** to configure:
- Platform settings
- Email templates
- Feature flags
- API integrations

**Status**: Coming in future update

## Best Practices

### Content Management

1. **Consistent Naming**
   - Use clear, descriptive film IDs
   - Follow a consistent format (e.g., MLN-001, MLN-002)

2. **Quality Metadata**
   - Always add loglines and synopses
   - Include accurate cast and crew information
   - Use relevant tags for better discovery

3. **Image URLs**
   - Use high-quality poster images (recommended: 2:3 aspect ratio)
   - Host images on reliable CDN
   - Use HTTPS URLs

4. **Language Information**
   - Be specific about available audio languages
   - List subtitle languages accurately
   - Use comma-separated format

### User Management

1. **Role Assignment**
   - Only grant admin to trusted team members
   - Use "User" role for all regular users
   - Reserve "Super Admin" for platform owners

2. **Security**
   - Regularly review admin user list
   - Remove admin access when team members leave
   - Monitor user activity

### Regular Maintenance

1. **Weekly Tasks**
   - Review newly added content
   - Check for user-reported issues
   - Update film metadata as needed

2. **Monthly Tasks**
   - Analyze platform statistics
   - Archive or remove outdated content
   - Review user roles and permissions

## Keyboard Shortcuts

While in admin panel:
- `Escape`: Close modals and dialogs
- `Tab`: Navigate between form fields
- `Enter`: Submit forms

## Troubleshooting

### Cannot Access Admin Dashboard

**Problem**: Admin Dashboard option not showing in user menu

**Solution**:
1. Verify admin role in database:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'your-user-id';
   ```
2. Confirm role is 'admin' or 'super_admin'
3. Sign out and sign back in
4. Clear browser cache

### Films Not Appearing on Frontend

**Problem**: Added films don't show on main site

**Solution**:
1. Verify film was saved successfully
2. Check CatalogProvider is fetching from database
3. Refresh the main site
4. Check browser console for errors

### Cannot Edit or Delete Films

**Problem**: Edit/Delete buttons not working

**Solution**:
1. Verify you're signed in as admin
2. Check browser console for errors
3. Verify RLS policies are correctly set
4. Try signing out and back in

### User Role Changes Not Saving

**Problem**: Role updates don't persist

**Solution**:
1. Check database connection
2. Verify user_roles table exists
3. Check for constraint violations
4. Review Supabase logs for errors

## Support

For additional help:
1. Check the main README.md
2. Review CREATE_ADMIN.md for setup issues
3. Consult Supabase documentation
4. Open an issue on GitHub

## Quick Reference

### URLs
- Main Dashboard: `/admin`
- Films Management: `/admin/films`
- Add Film: `/admin/films/new`
- Edit Film: `/admin/films/edit/:id`
- User Management: `/admin/users`
- Analytics: `/admin/analytics`
- Settings: `/admin/settings`

### Common SQL Queries

**List all admins:**
```sql
SELECT u.email, r.role
FROM auth.users u
JOIN user_roles r ON u.id = r.user_id
WHERE r.role IN ('admin', 'super_admin');
```

**Find user ID by email:**
```sql
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

**Count films by genre:**
```sql
SELECT genre, COUNT(*) FROM films GROUP BY genre ORDER BY COUNT(*) DESC;
```

**Most viewed films:**
```sql
SELECT title, views FROM films ORDER BY views DESC LIMIT 10;
```

---

**Remember**: The admin panel is powerful. Always double-check before deleting content or changing user roles.
