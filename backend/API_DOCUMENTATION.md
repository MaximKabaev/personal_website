# Personal Website Backend API Documentation

## Base URL
```
http://localhost:3001/api
```

## Database Connection
The API uses PostgreSQL via Supabase with connection pooling for optimal performance.

## Authentication

### Overview
The API uses Supabase JWT tokens for authentication. Protected endpoints require a valid Bearer token in the Authorization header.

### Authentication Levels:
- **Public Read**: GET endpoints for projects, folders, and devlog are publicly accessible
- **Protected Write**: All POST, PUT, DELETE operations require authentication
- **Strictly Protected**: Sensitive operations like tweet syncing require authentication even in development

### Request Headers
For protected endpoints, include:
```
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
Content-Type: application/json
```

### Development Mode
In development (`NODE_ENV=development`), the auth middleware allows:
- Unauthenticated access if no Authorization header is present
- Validates token if Authorization header is provided
- This allows local development without Supabase configuration

### Production Mode
In production, all protected endpoints strictly require valid authentication.

### Admin Panel
The `/admin` routes are protected by:
- Frontend: AuthGuard component that redirects to login
- Backend: All write operations require authentication
- Login page at `/admin/login` (email/password only, no signup)

## Response Format
All responses are in JSON format. Error responses follow this structure:
```json
{
  "error": "Error message description"
}
```

---

## Health Check

### GET /api/health
Check if the API is running and healthy.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## Projects

### GET /api/projects
Get all projects with optional filtering.

**Query Parameters:**
- `folder_id` (string, optional): Filter by folder ID
- `status` (string, optional): Filter by status (`active`, `completed`, `archived`, `paused`)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Weather API",
    "slug": "weather-api",
    "description": "A RESTful API for weather data",
    "folder_id": "uuid",
    "status": "active",
    "tech_stack": ["Node.js", "Express", "PostgreSQL"],
    "github_url": "https://github.com/...",
    "demo_url": "https://demo.example.com",
    "display_order": 0,
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z"
  }
]
```

### GET /api/projects/:identifier
Get a single project by ID or slug.

**Parameters:**
- `identifier`: Project UUID or slug

**Response:**
```json
{
  "id": "uuid",
  "name": "Weather API",
  "slug": "weather-api",
  "description": "A RESTful API for weather data",
  "folder_id": "uuid",
  "status": "active",
  "tech_stack": ["Node.js", "Express", "PostgreSQL"],
  "github_url": "https://github.com/...",
  "demo_url": "https://demo.example.com",
  "display_order": 0,
  "created_at": "2024-01-20T10:30:00.000Z",
  "updated_at": "2024-01-20T10:30:00.000Z"
}
```

### GET /api/projects/by-path/:folderSlug/:projectSlug
Get a project by its folder and project slugs (for nested URLs).

**Parameters:**
- `folderSlug`: Folder slug (e.g., "api")
- `projectSlug`: Project slug (e.g., "weather-api")

**Example:** `/api/projects/by-path/api/weather-api`

**Response:** Same as single project response

### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "New Project",
  "slug": "new-project",
  "description": "Project description",
  "folder_id": "uuid (optional)",
  "status": "active",
  "tech_stack": ["React", "TypeScript"],
  "github_url": "https://github.com/...",
  "demo_url": "https://demo.example.com",
  "display_order": 0
}
```

**Response:** Created project object (201)

### PUT /api/projects/:id
Update an existing project.

**Parameters:**
- `id`: Project UUID

**Request Body:** Any subset of project fields to update
```json
{
  "name": "Updated Name",
  "status": "completed",
  "tech_stack": ["React", "TypeScript", "Tailwind"]
}
```

**Response:** Updated project object

### DELETE /api/projects/:id
Delete a project.

**Parameters:**
- `id`: Project UUID

**Response:** 204 No Content

---

## Folders

### GET /api/folders
Get all folders with optional parent filtering.

**Query Parameters:**
- `parent_id` (string, optional): Filter by parent folder ID. Use "null" for root folders.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "API Projects",
    "slug": "api",
    "parent_id": null,
    "display_order": 0,
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z"
  }
]
```

### GET /api/folders/tree
Get the complete folder hierarchy as a nested tree structure.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "API Projects",
    "slug": "api",
    "parent_id": null,
    "display_order": 0,
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z",
    "children": [
      {
        "id": "uuid",
        "name": "REST APIs",
        "slug": "rest",
        "parent_id": "parent-uuid",
        "display_order": 0,
        "children": []
      }
    ]
  }
]
```

### GET /api/folders/:identifier
Get a single folder by ID or slug.

**Parameters:**
- `identifier`: Folder UUID or slug

**Response:** Single folder object

### POST /api/folders
Create a new folder.

**Request Body:**
```json
{
  "name": "New Folder",
  "slug": "new-folder",
  "parent_id": "uuid (optional)",
  "display_order": 0
}
```

**Response:** Created folder object (201)

### PUT /api/folders/:id
Update an existing folder.

**Parameters:**
- `id`: Folder UUID

**Request Body:** Any subset of folder fields to update

**Response:** Updated folder object

### DELETE /api/folders/:id
Delete a folder.

**Parameters:**
- `id`: Folder UUID

**Response:** 204 No Content

---

## Devlog Entries

### GET /api/devlog
Get devlog entries with optional filtering.

**Query Parameters:**
- `project_id` (string, optional): Filter by project ID
- `entry_type` (string, optional): Filter by type (`progress`, `milestone`, `bug_fix`, `feature`, `thoughts`)
- `limit` (number, default: 10): Number of entries to return
- `offset` (number, default: 0): Pagination offset

**Response:**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Initial API Setup",
    "content": "Set up the basic Express server...",
    "entry_type": "milestone",
    "tags": ["setup", "typescript"],
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z",
    "project": {
      "id": "uuid",
      "name": "Weather API",
      "slug": "weather-api"
    }
  }
]
```

### GET /api/devlog/recent
Get the most recent devlog entries across all projects.

**Query Parameters:**
- `limit` (number, default: 5): Number of entries to return

**Response:** Array of devlog entries with project details

### GET /api/devlog/project/:projectId
Get all devlog entries for a specific project.

**Parameters:**
- `projectId`: Project UUID

**Query Parameters:**
- `limit` (number, default: 20): Number of entries to return
- `offset` (number, default: 0): Pagination offset

**Response:** Array of devlog entries

### GET /api/devlog/:id
Get a single devlog entry.

**Parameters:**
- `id`: Entry UUID

**Response:**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "Initial API Setup",
  "content": "Set up the basic Express server...",
  "entry_type": "milestone",
  "tags": ["setup", "typescript"],
  "created_at": "2024-01-20T10:30:00.000Z",
  "updated_at": "2024-01-20T10:30:00.000Z",
  "project": {
    "id": "uuid",
    "name": "Weather API",
    "slug": "weather-api"
  }
}
```

### POST /api/devlog
Create a new devlog entry.

**Request Body:**
```json
{
  "project_id": "uuid (required)",
  "title": "Entry Title (required)",
  "content": "Entry content... (required)",
  "entry_type": "progress",
  "tags": ["feature", "api"]
}
```

**Response:** Created devlog entry (201)

### PUT /api/devlog/:id
Update an existing devlog entry.

**Parameters:**
- `id`: Entry UUID

**Request Body:** Any subset of entry fields to update (except `project_id`)
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "entry_type": "milestone",
  "tags": ["completed", "v1.0"]
}
```

**Response:** Updated devlog entry

### DELETE /api/devlog/:id
Delete a devlog entry.

**Parameters:**
- `id`: Entry UUID

**Response:** 204 No Content

---

## Error Codes

- `200 OK`: Successful request
- `201 Created`: Resource successfully created
- `204 No Content`: Resource successfully deleted
- `400 Bad Request`: Invalid request parameters or body
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Example Usage

### Creating a project in a folder

1. First, create or get the folder:
```bash
POST /api/folders
{
  "name": "API Projects",
  "slug": "api"
}
```

2. Create the project with the folder ID:
```bash
POST /api/projects
{
  "name": "Weather API",
  "slug": "weather-api",
  "folder_id": "folder-uuid-here",
  "description": "RESTful weather API",
  "status": "active",
  "tech_stack": ["Node.js", "Express"]
}
```

3. Add a devlog entry:
```bash
POST /api/devlog
{
  "project_id": "project-uuid-here",
  "title": "Project Setup",
  "content": "Initial project setup completed",
  "entry_type": "milestone"
}
```

### Accessing nested project URLs

For a project "weather-api" in folder "api":
- Frontend URL: `/projects/api/weather-api`
- API endpoint: `/api/projects/by-path/api/weather-api`

---

## Database Schema

### Folders Table
- Supports hierarchical structure with `parent_id`
- Unique `slug` for URL-friendly paths
- `display_order` for custom sorting

### Projects Table
- Can belong to a folder via `folder_id`
- Unique constraint on `(folder_id, slug)` for unique paths
- Supports various statuses and tech stack arrays

### Devlog Entries Table
- Must belong to a project
- Supports different entry types for categorization
- Tags array for flexible labeling

### Project Media Table (Future)
- Prepared for image/video attachments
- Can be linked to projects or specific devlog entries

---

## Rate Limiting
Currently not implemented. Will be added in production.

## CORS
Configured to accept requests from the frontend URL (default: `http://localhost:3000`).

## Environment Variables
```env
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Frontend Routes

The frontend uses a catch-all dynamic route to handle both root-level and folder-based projects:

- **Root-level projects**: `/projects/project-slug`
- **Folder-based projects**: `/projects/folder-slug/project-slug`
- **Admin panel**: `/admin` (no auth - add before production!)

## Project URL Structure

Projects can exist at two levels:
1. **Root level**: No folder association, accessed via `/projects/[slug]`
2. **In folders**: Associated with a folder, accessed via `/projects/[folder]/[slug]`

Example:
- `/projects/personal-website` - Root-level project
- `/projects/api/weather-api` - Project "weather-api" in folder "api"
- `/projects/personal/2` - Project "2" in folder "personal"

## Important Notes

1. **Slug Uniqueness**: 
   - Project slugs must be unique within their context (root or folder)
   - A root project can have the same slug as a project in a folder

2. **Pooler Connection**: 
   - Using Supabase pooler for better connection management
   - Handles IPv4/IPv6 compatibility issues

3. **Next.js 15 Compatibility**:
   - Dynamic route params are now Promises and must be awaited
   - Updated all route handlers to handle async params

4. **File Structure**:
   ```
   /backend         - Express API server
   /frontend        - Next.js application
   /.gitignore      - Comprehensive ignore file
   ```