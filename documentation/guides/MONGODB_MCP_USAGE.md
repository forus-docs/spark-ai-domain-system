# MongoDB MCP Server Usage Guide

## Setup Complete! 🎉

The official MongoDB MCP server has been configured for your project. Here's how to use it:

## 1. Restart Claude Code

After adding the `.mcp.json` configuration, you need to restart Claude Code:
```bash
# Exit Claude Code (Ctrl+C or Cmd+C)
# Then restart:
claude
```

## 2. Available MongoDB MCP Tools

Once restarted, you'll have access to these MCP tools:

### Connection Management
- `mcp__mongodb__connect` - Connect to MongoDB database

### Query Operations
- `mcp__mongodb__find` - Find documents in a collection
- `mcp__mongodb__aggregate` - Run aggregation pipelines
- `mcp__mongodb__distinct` - Get distinct values for a field
- `mcp__mongodb__count-documents` - Count documents matching a query

### Data Modification
- `mcp__mongodb__insert-one` - Insert a single document
- `mcp__mongodb__insert-many` - Insert multiple documents
- `mcp__mongodb__update-one` - Update a single document
- `mcp__mongodb__update-many` - Update multiple documents
- `mcp__mongodb__replace-one` - Replace a document
- `mcp__mongodb__delete-one` - Delete a single document
- `mcp__mongodb__delete-many` - Delete multiple documents

### Collection Management
- `mcp__mongodb__list-collections` - List all collections
- `mcp__mongodb__create-collection` - Create a new collection
- `mcp__mongodb__delete-collection` - Delete a collection
- `mcp__mongodb__rename-collection` - Rename a collection

### Database Management
- `mcp__mongodb__list-databases` - List all databases
- `mcp__mongodb__create-database` - Create a new database
- `mcp__mongodb__delete-database` - Delete a database

### Schema Operations
- `mcp__mongodb__schema` - Get collection schema information

## 3. Example Usage

### Finding Your User
```javascript
// Using the MCP tool to find your user
mcp__mongodb__find({
  collection: "users",
  query: { email: "jacques.berg@forus.digital" }
})
```

### Viewing All Posts
```javascript
// Get all posts with their domains
mcp__mongodb__find({
  collection: "posts",
  query: {},
  sort: { domain: 1, priority: -1 }
})
```

### Check User's Assigned Posts
```javascript
// Find posts assigned to a specific user
mcp__mongodb__find({
  collection: "userposts",
  query: { userId: "68757f927d23d26a711a406f" }
})
```

### Aggregation Example - User Post Summary
```javascript
// Get summary of posts per user
mcp__mongodb__aggregate({
  collection: "userposts",
  pipeline: [
    { $group: { 
      _id: "$userId", 
      totalPosts: { $sum: 1 },
      completedPosts: { $sum: { $cond: ["$isCompleted", 1, 0] } }
    }}
  ]
})
```

## 4. Schema Inspection

### View Collection Schema
```javascript
// Get schema information for any collection
mcp__mongodb__schema({
  collection: "users"
})
```

This will show:
- Field types
- Field distributions
- Common patterns
- Null/missing fields

## 5. Data Editing Examples

### Update User's Identity Verification
```javascript
mcp__mongodb__update-one({
  collection: "users",
  filter: { email: "jacques.berg@forus.digital" },
  update: { $set: { "identity.isVerified": true } }
})
```

### Mark a Post as Completed
```javascript
mcp__mongodb__update-one({
  collection: "userposts",
  filter: { _id: "687652d06fc008a21adc0c51" },
  update: { 
    $set: { 
      isCompleted: true,
      completedAt: new Date()
    }
  }
})
```

## 6. Understanding Your Schema

### Key Collections and Relationships

```
users
├── _id (ObjectId) 
├── email (String)
├── domains (Array)
│   └── { domainId, role, joinedAt }
└── identity
    └── { isVerified, verifiedAt }

posts (Master Templates)
├── _id (ObjectId)
├── domain (String: 'all', 'maven-hub', etc.)
├── postType (String)
├── nextPosts (Array of post IDs)
└── prerequisitePosts (Array of post IDs)

userposts (User's Assigned Posts)
├── _id (ObjectId)
├── userId → references users._id
├── postId → references posts._id
├── isCompleted (Boolean)
└── isHidden (Boolean)
```

## 7. Safety Tips

- The MCP server has full database access
- Always double-check queries before running deletes
- Consider adding `--readOnly` flag for safer exploration:

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": [
        "-y",
        "mongodb-mcp-server@latest",
        "--connectionString",
        "mongodb://localhost:27017/spark-ai",
        "--readOnly"
      ]
    }
  }
}
```

## 8. Troubleshooting

If MCP tools don't appear after restart:
1. Check if MongoDB is running: `lsof -i :27017`
2. Verify .mcp.json is in the project root
3. Check Claude Code logs for connection errors
4. Try connecting with MongoDB Compass first to verify connection string

## Next Steps

1. Restart Claude Code to load the MCP tools
2. Use `mcp__mongodb__list-collections` to see all collections
3. Explore your data with `mcp__mongodb__find`
4. Use `mcp__mongodb__schema` to understand data structures