# NetBuild Renaming Report

## Executive Summary

This report outlines the comprehensive plan to rename the "Spark AI Domain System" to "NetBuild". The rename reflects the platform's true purpose: building professional networks and onboarding members into domain-specific ecosystems, rather than being primarily an AI tool.

## Rationale for Renaming

### Current Misalignment
- **Name**: "Spark AI Domain System" suggests AI is the primary feature
- **Reality**: Platform focuses on network building, member onboarding, and community management
- **AI Role**: Limited to task assistance and chat support - not the core value proposition

### Why "NetBuild"
1. **Accurate Description**: Clearly communicates building networks
2. **Action-Oriented**: Verb+noun structure suggests active creation
3. **Memorable**: Short, punchy, easy to remember
4. **Professional**: Suitable for B2B enterprise context
5. **No AI Hype**: Avoids overselling AI capabilities

## Scope of Changes

### 1. Branding & UI (High Priority)
| Location | Current | New |
|----------|---------|-----|
| App Bar | "Spark AI" | "NetBuild" |
| Sidebar | "FOR**US** Spark AI" | "FOR**US** NetBuild" |
| Login Page | "Spark AI Domain System" | "NetBuild" |
| Page Titles | "Spark AI - [Page]" | "NetBuild - [Page]" |
| Footer | "Spark AI Domain System" | "NetBuild" |

### 2. Technical Infrastructure
| Component | Current | New |
|-----------|---------|-----|
| Package Name | `spark-ai` | `netbuild` |
| Database Name | `spark-ai` | `netbuild` |
| MongoDB URI | `mongodb://localhost:27017/spark-ai` | `mongodb://localhost:27017/netbuild` |
| Folder Name | `/app-spark` | `/app-netbuild` |

### 3. Documentation Files
- README.md
- CLAUDE.md (workspace and project)
- All markdown documentation in `/docs`
- Scripts documentation
- Technical debt register
- Sprint planning documents

### 4. Code References
- Component names (e.g., `SparkAppBar` → `NetBuildAppBar`)
- Comments mentioning "Spark AI"
- Error messages
- Console logs
- API documentation

## Implementation Plan

### Phase 1: Preparation (Day 1)
1. **Backup Current State**
   - Create git branch: `feature/netbuild-rename`
   - Document all "Spark" references
   - Create migration scripts

2. **Database Migration Plan**
   - Export current `spark-ai` database
   - Prepare import scripts for `netbuild` database
   - Test migration process

### Phase 2: Core Renaming (Day 2)
1. **Package & Project**
   ```bash
   # Update package.json
   "name": "spark-ai" → "name": "netbuild"
   
   # Rename folder
   mv app-spark app-netbuild
   ```

2. **Environment Variables**
   ```env
   MONGODB_URI=mongodb://localhost:27017/netbuild
   ```

3. **Database Migration**
   ```bash
   # Export existing data
   mongodump --db spark-ai --out ./backup
   
   # Import to new database
   mongorestore --db netbuild ./backup/spark-ai
   ```

### Phase 3: UI Updates (Day 3)
1. **Component Updates**
   - SparkAppBar → NetBuildAppBar
   - Update all UI text references
   - Update logos/branding if applicable

2. **User-Facing Text**
   - Login/signup screens
   - Welcome messages
   - Help text
   - Error messages

### Phase 4: Documentation (Day 4)
1. Update all markdown files
2. Update code comments
3. Update API documentation
4. Update deployment guides

### Phase 5: Testing & Validation (Day 5)
1. Full application testing
2. Database connection verification
3. Authentication flow testing
4. Documentation review

## Risk Assessment

### Low Risk
- UI text changes
- Documentation updates
- Component renaming

### Medium Risk
- Database migration (mitigated by backups)
- Environment variable updates
- Folder renaming

### High Risk
- Breaking external integrations
- Missing hardcoded references
- User confusion during transition

## Rollback Plan

1. **Git Reversion**: All changes in feature branch
2. **Database Backup**: Complete mongodump before migration
3. **Environment Variables**: Document all original values
4. **Communication**: Notify users of any issues

## Success Metrics

1. **Technical Success**
   - [ ] All "Spark AI" references replaced
   - [ ] Application runs without errors
   - [ ] Database migration successful
   - [ ] All tests pass

2. **User Success**
   - [ ] Clear communication to existing users
   - [ ] No disruption to active sessions
   - [ ] Improved brand clarity

## Estimated Timeline

- **Total Duration**: 5 working days
- **Developer Hours**: ~20-25 hours
- **Testing Hours**: ~5-10 hours
- **Documentation**: ~5 hours

## Recommendations

1. **Announce Early**: Inform users about the upcoming change
2. **Staged Rollout**: Consider renaming in stages if possible
3. **Monitor Closely**: Watch for any missed references post-deployment
4. **Update Marketing**: Ensure all external materials reflect new name

## Conclusion

The rename from "Spark AI Domain System" to "NetBuild" is a strategic move that better aligns the product name with its actual purpose and value proposition. While the technical implementation is straightforward, careful planning and execution will ensure a smooth transition for all stakeholders.

## Appendix: Search & Replace Commands

```bash
# Find all instances of "Spark AI" (case-sensitive)
grep -r "Spark AI" . --exclude-dir=node_modules --exclude-dir=.git

# Find all instances of "spark-ai" (case-sensitive)
grep -r "spark-ai" . --exclude-dir=node_modules --exclude-dir=.git

# Find all instances of "Spark" (case-insensitive)
grep -ri "spark" . --exclude-dir=node_modules --exclude-dir=.git

# Count occurrences
grep -r "Spark" . --exclude-dir=node_modules --exclude-dir=.git | wc -l
```

## Next Steps

1. **Approval**: Get stakeholder sign-off on the rename
2. **Schedule**: Set implementation dates
3. **Communicate**: Notify users and team members
4. **Execute**: Follow the implementation plan
5. **Monitor**: Track success metrics post-launch