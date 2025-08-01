#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixAPIRoute(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Find the export async function line
    const exportMatch = content.match(/export async function (GET|POST|PUT|DELETE|PATCH)\s*\([^)]+\)\s*{/);
    if (!exportMatch) {
      console.log(`⚠️  No export function found in ${filePath}`);
      return false;
    }
    
    // Check if there's already a try block right after the function declaration
    const functionStartIndex = content.indexOf(exportMatch[0]);
    const afterFunctionDecl = content.substring(functionStartIndex + exportMatch[0].length).trim();
    
    if (afterFunctionDecl.startsWith('try {')) {
      console.log(`✅ ${filePath} already has try block`);
      return true;
    }
    
    // Find where to insert the try block
    const lines = content.split('\n');
    let functionLine = -1;
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(exportMatch[0])) {
        functionLine = i;
        inFunction = true;
        // Count opening brace
        braceCount = 1;
        continue;
      }
      
      if (inFunction) {
        // Count braces to find the matching closing brace
        for (const char of lines[i]) {
          if (char === '{') braceCount++;
          if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              // Found the closing brace of the function
              // The catch block should be right before this line
              if (i > 0 && lines[i-1].trim().includes('} catch')) {
                // Need to add try block
                // Insert try { after the function declaration
                lines.splice(functionLine + 1, 0, '  try {');
                
                // The rest should be properly indented
                content = lines.join('\n');
                await fs.writeFile(filePath, content, 'utf8');
                console.log(`✅ Fixed ${filePath}`);
                return true;
              }
            }
          }
        }
      }
    }
    
    console.log(`⚠️  Could not fix ${filePath} - manual intervention needed`);
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  const files = [
    'app/api/domain-tasks/debug-assign/route.ts',
    'app/api/task-executions/[executionId]/info/route.ts',
    'app/api/task-executions/recent/route.ts',
    'app/api/tasks/assigned/route.ts'
  ];

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    await fixAPIRoute(filePath);
  }
}

main().catch(console.error);