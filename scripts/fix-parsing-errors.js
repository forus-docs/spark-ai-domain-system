#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixParsingErrors() {
  const files = [
    'app/api/domain-tasks/debug-assign/route.ts',
    'app/api/domains/[domainId]/adopt-task/route.ts', 
    'app/api/task-executions/[executionId]/info/route.ts',
    'app/api/task-executions/recent/route.ts',
    'app/api/tasks/assigned/route.ts'
  ];

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Fix the common pattern of extra try-catch blocks
      // Pattern: closing brace followed by catch on next line
      content = content.replace(/}\s*\n\s*} catch \(error\) {/g, '\n  } catch (error) {');
      
      // Fix any remaining double closing braces before catch
      content = content.replace(/}\s*}\s*catch/g, '  } catch');
      
      // Write back
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error.message);
    }
  }
}

fixParsingErrors().catch(console.error);