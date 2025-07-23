/**
 * File configuration and validation utilities
 * Based on LibreChat's comprehensive file support
 */

// Comprehensive MIME types list
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
  'application/csv',
  
  // Text and Code
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'text/xml',
  
  // Programming languages
  'text/x-python',
  'text/x-java-source',
  'text/x-c',
  'text/x-c++',
  'text/x-csharp',
  'text/x-php',
  'text/x-ruby',
  'text/x-go',
  'text/x-rust',
  'text/x-swift',
  'text/x-kotlin',
  'text/x-scala',
  'text/x-r',
  'text/x-sql',
  'text/x-sh',
  'text/x-yaml',
  'application/x-yaml',
  
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/x-gzip',
  
  // Other
  'application/rtf',
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
  'application/vnd.oasis.opendocument.presentation', // .odp
];

// File extensions to MIME type mapping for files without proper MIME types
export const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Spreadsheets
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  
  // Text and Code
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  
  // Programming languages
  '.py': 'text/x-python',
  '.java': 'text/x-java-source',
  '.c': 'text/x-c',
  '.cpp': 'text/x-c++',
  '.cc': 'text/x-c++',
  '.cs': 'text/x-csharp',
  '.php': 'text/x-php',
  '.rb': 'text/x-ruby',
  '.go': 'text/x-go',
  '.rs': 'text/x-rust',
  '.swift': 'text/x-swift',
  '.kt': 'text/x-kotlin',
  '.scala': 'text/x-scala',
  '.r': 'text/x-r',
  '.sql': 'text/x-sql',
  '.sh': 'text/x-sh',
  '.bash': 'text/x-sh',
  '.yaml': 'text/x-yaml',
  '.yml': 'text/x-yaml',
  
  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/x-gzip',
  
  // Other
  '.rtf': 'application/rtf',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
};

// File validation configuration
export const FILE_CONFIG = {
  maxFileSize: 512 * 1024 * 1024, // 512MB
  maxFileCount: 10,
  maxTotalSize: 512 * 1024 * 1024, // 512MB total
  imageMaxDimensions: {
    width: 1900,
    height: 1900,
  },
  imageQuality: 0.92,
};

// File type categories for icons and styling
export const FILE_CATEGORIES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
  code: ['text/javascript', 'text/x-python', 'text/x-java-source', 'text/x-c', 'text/x-c++', 'text/x-csharp', 'application/json'],
  text: ['text/plain', 'text/markdown', 'text/html', 'text/css'],
  archive: ['application/zip', 'application/x-tar', 'application/x-gzip'],
};

// Get file category for styling
export function getFileCategory(mimeType: string): keyof typeof FILE_CATEGORIES | 'other' {
  for (const [category, types] of Object.entries(FILE_CATEGORIES)) {
    if (types.includes(mimeType)) {
      return category as keyof typeof FILE_CATEGORIES;
    }
  }
  return 'other';
}

// Get MIME type from file extension if browser doesn't provide it
export function getMimeTypeFromExtension(filename: string): string | null {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? EXTENSION_TO_MIME_TYPE[ext] || null : null;
}

// Validate file type
export function isValidFileType(file: File): boolean {
  let mimeType = file.type;
  
  // If browser doesn't provide MIME type, try to get it from extension
  if (!mimeType || mimeType === '') {
    mimeType = getMimeTypeFromExtension(file.name) || '';
  }
  
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

// Validate file size
export function isValidFileSize(file: File): boolean {
  return file.size > 0 && file.size <= FILE_CONFIG.maxFileSize;
}

// Get human-readable file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if file needs conversion (HEIC/HEIF)
export function needsConversion(file: File): boolean {
  return file.type === 'image/heic' || file.type === 'image/heif';
}

// File validation result
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

// Validate multiple files
export function validateFiles(files: File[], existingFiles: File[] = []): FileValidationResult[] {
  const results: FileValidationResult[] = [];
  let totalSize = existingFiles.reduce((sum, f) => sum + f.size, 0);
  
  // Check file count
  if (files.length + existingFiles.length > FILE_CONFIG.maxFileCount) {
    return [{
      valid: false,
      error: `Maximum ${FILE_CONFIG.maxFileCount} files allowed`,
    }];
  }
  
  for (const file of files) {
    // Check for duplicates
    if (existingFiles.some(f => f.name === file.name && f.size === file.size)) {
      results.push({
        valid: false,
        error: `File "${file.name}" already selected`,
        file,
      });
      continue;
    }
    
    // Check file size
    if (!isValidFileSize(file)) {
      if (file.size === 0) {
        results.push({
          valid: false,
          error: `File "${file.name}" is empty`,
          file,
        });
      } else {
        results.push({
          valid: false,
          error: `File "${file.name}" exceeds maximum size of ${formatFileSize(FILE_CONFIG.maxFileSize)}`,
          file,
        });
      }
      continue;
    }
    
    // Check file type
    if (!isValidFileType(file)) {
      results.push({
        valid: false,
        error: `File type "${file.type || 'unknown'}" not supported for "${file.name}"`,
        file,
      });
      continue;
    }
    
    // Check total size
    totalSize += file.size;
    if (totalSize > FILE_CONFIG.maxTotalSize) {
      results.push({
        valid: false,
        error: `Total file size exceeds maximum of ${formatFileSize(FILE_CONFIG.maxTotalSize)}`,
        file,
      });
      continue;
    }
    
    // File is valid
    results.push({
      valid: true,
      file,
    });
  }
  
  return results;
}