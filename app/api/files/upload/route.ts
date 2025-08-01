import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { 
  validateFiles, 
  isValidFileType, 
  isValidFileSize,
  formatFileSize,
  FILE_CONFIG 
} from '@/app/lib/file-config';

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

interface FileUploadResponse {
  file_id: string;
  filename: string;
  originalName: string;
  filepath: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
}

export async function POST(request: NextRequest) {
  // Get session from NextAuth
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = await session.user;
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!isValidFileType(file)) {
      return NextResponse.json(
        { error: `File type "${file.type || 'unknown'}" not supported` },
        { status: 400 }
      );
    }

    if (!isValidFileSize(file)) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${formatFileSize(FILE_CONFIG.maxFileSize)}` },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const fileId = uuidv4();
    const ext = path.extname(file.name);
    const filename = `${fileId}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Get image dimensions if it's an image
    let width: number | undefined;
    let height: number | undefined;
    
    if (file.type.startsWith('image/')) {
      // In a real implementation, you'd use a library like sharp to get dimensions
      // For now, we'll parse them from the form data if provided
      const widthStr = formData.get('width') as string;
      const heightStr = formData.get('height') as string;
      
      if (widthStr && heightStr) {
        width = parseInt(widthStr, 10);
        height = parseInt(heightStr, 10);
      }
    }

    // Prepare response
    const response: FileUploadResponse = {
      file_id: fileId,
      filename,
      originalName: file.name,
      filepath: `/uploads/${filename}`, // Relative path for serving
      type: file.type,
      size: file.size,
      width,
      height,
      uploadedAt: new Date().toISOString(),
    };

    // In a real implementation, you'd also:
    // 1. Store file metadata in database
    // 2. Associate file with user
    // 3. Generate thumbnails for images
    // 4. Scan for viruses
    // 5. Set up proper file serving endpoint

    return NextResponse.json(response);
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Note: In App Router, bodyParser configuration is not needed
// FormData is handled automatically by Next.js