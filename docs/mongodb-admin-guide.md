# MongoDB Admin Guide for Spark AI

## MongoDB Compass Setup

MongoDB Compass has been installed on your system. Here's how to connect and explore your database:

### 1. Launch MongoDB Compass
- Open MongoDB Compass from your Applications folder
- Or run from terminal: `open -a "MongoDB Compass"`

### 2. Connect to Your Local MongoDB
Use this connection string:
```
mongodb://localhost:27017/spark-ai
```

Or simply:
1. Click "New Connection"
2. Leave the default `mongodb://localhost:27017` 
3. Click "Connect"
4. Select the `spark-ai` database from the left sidebar

### 3. Key Collections to Explore

#### Users Collection
- **Purpose**: Stores user accounts
- **Key Fields**: 
  - `_id`: MongoDB ObjectId (unique identifier)
  - `email`: User's email
  - `domains`: Array of joined domains
  - `identity.isVerified`: Boolean for verification status

#### Posts Collection  
- **Purpose**: Master post templates
- **Key Fields**:
  - `domain`: Which domain the post belongs to ('all', 'maven-hub', etc.)
  - `postType`: Type of post (onboarding, training, etc.)
  - `nextPosts`: Array of post IDs to assign after completion
  - `prerequisitePosts`: Required posts before this one

#### UserPosts Collection
- **Purpose**: Posts assigned to specific users
- **Key Fields**:
  - `userId`: References Users._id
  - `postId`: References Posts._id
  - `isCompleted`: Boolean
  - `isHidden`: Boolean

### 4. Useful Compass Features

#### Schema Visualization
1. Click on any collection
2. Go to the "Schema" tab
3. See field types, distributions, and patterns

#### Document Editing
1. In any collection, click on a document
2. Click the "Edit" button
3. Modify fields directly
4. Click "Update" to save

#### Query Builder
1. Use the query bar at the top
2. Example queries:
   ```javascript
   // Find all posts for maven-hub domain
   { domain: "maven-hub" }
   
   // Find completed user posts
   { isCompleted: true }
   
   // Find user by email
   { email: "jacques.berg@forus.digital" }
   ```

#### Aggregation Pipeline
1. Go to "Aggregations" tab
2. Build complex queries visually
3. Example: Join users with their posts

### 5. Understanding Relationships

While MongoDB doesn't have foreign keys like SQL databases, our app uses references:

- `UserPosts.userId` → references `Users._id`
- `UserPosts.postId` → references `Posts._id`
- `Users.domains[].domainId` → references domain IDs (from mock data)

### 6. Backup Your Data

In Compass:
1. Select a collection
2. Click "Export Collection"
3. Choose JSON format
4. Save to a safe location

## Alternative: Web-Based Admin UI

If you prefer a web-based solution integrated into your app, consider:

### Option 1: AdminJS (Recommended for Next.js)
```bash
npm install adminjs @adminjs/express @adminjs/mongoose
```

Quick setup in a new route:
```typescript
// app/api/admin/[[...slug]]/route.ts
import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import * as AdminJSMongoose from '@adminjs/mongoose'
```

### Option 2: Mongo Express (Lightweight)
```bash
docker run -it --rm \
  --name mongo-express \
  --network host \
  -e ME_CONFIG_MONGODB_URL="mongodb://localhost:27017/" \
  -p 8081:8081 \
  mongo-express
```

Then visit: http://localhost:8081

## Tips for Schema Management

1. **Document Your Schema**: Add comments to your Mongoose models
2. **Use Mongoose Virtuals**: For computed relationships
3. **Create Indexes**: For frequently queried fields
4. **Regular Backups**: Export important collections regularly

## Security Note

⚠️ These admin tools provide full database access. In production:
- Use authentication on MongoDB
- Restrict access to admin tools
- Use read-only users when possible
- Never expose admin interfaces publicly