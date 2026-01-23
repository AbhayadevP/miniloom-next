// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received');
    
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const durationStr = formData.get('duration') as string;

    console.log('Video file:', video?.name, video?.size);
    console.log('Duration:', durationStr);

    if (!video) {
      console.error('No video file provided');
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    const duration = parseFloat(durationStr);
    if (isNaN(duration) || duration <= 0) {
      console.error('Invalid duration:', durationStr);
      return NextResponse.json(
        { error: 'Invalid duration provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    console.log('Uploads directory:', uploadsDir);
    
    if (!existsSync(uploadsDir)) {
      console.log('Creating uploads directory...');
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `video-${timestamp}.webm`;
    const filepath = path.join(uploadsDir, filename);

    console.log('Saving to:', filepath);

    // Convert File to Buffer and save
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log('File saved successfully');

    // Save video metadata to database
    console.log('Saving to database...');
    const videoRecord = await prisma.video.create({
      data: {
        filename,
        filepath: `/uploads/${filename}`,
        duration,
      },
    });

    console.log('Database record created:', videoRecord.id);

    return NextResponse.json({
      id: videoRecord.id,
      filename: videoRecord.filename,
      filepath: videoRecord.filepath,
      message: 'Video uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to upload video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}