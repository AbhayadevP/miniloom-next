import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 ===== UPLOAD REQUEST STARTED =====');
    
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const durationStr = formData.get('duration') as string;

    console.log('📹 Video received:', {
      name: video?.name,
      size: video?.size,
      type: video?.type
    });
    
    console.log('⏱️ Duration string received:', durationStr);
    console.log('⏱️ Duration parsed:', parseFloat(durationStr));

    // Validate video file
    if (!video) {
      console.error('❌ ERROR: No video file provided');
      return NextResponse.json(
        { 
          error: 'No video file provided',
          details: 'Please select a video to upload'
        },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = parseFloat(durationStr);
    console.log('✅ Duration validation:', {
      isNaN: isNaN(duration),
      isInfinity: duration === Infinity,
      isNegative: duration <= 0,
      isValid: !isNaN(duration) && duration !== Infinity && duration > 0
    });

    if (isNaN(duration) || duration === Infinity || duration <= 0) {
      console.error('❌ ERROR: Invalid duration:', {
        raw: durationStr,
        parsed: duration,
        isNaN: isNaN(duration),
        isInfinity: duration === Infinity
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid video duration',
          details: `Duration must be a positive number. Received: ${durationStr} (parsed as ${duration})`
        },
        { status: 400 }
      );
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    console.log('📁 Uploads directory:', uploadsDir);
    
    if (!existsSync(uploadsDir)) {
      console.log('📁 Creating uploads directory...');
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `video-${timestamp}-${random}.webm`;
    const filepath = path.join(uploadsDir, filename);

    console.log('💾 Saving file to:', filepath);

    // Save file
    try {
      const bytes = await video.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);
      console.log('✅ File saved successfully:', {
        size: buffer.length,
        path: filepath
      });
    } catch (fileError) {
      console.error('❌ ERROR saving file:', fileError);
      throw new Error(`Failed to save file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
    }

    // Save to database
    console.log('💾 Saving to database with duration:', duration);
    
    try {
      const videoRecord = await prisma.video.create({
        data: {
          filename,
          filepath: `/uploads/${filename}`,
          duration: duration,
        },
      });

      console.log('✅ Database record created:', {
        id: videoRecord.id,
        filename: videoRecord.filename,
        duration: videoRecord.duration
      });

      return NextResponse.json({
        success: true,
        id: videoRecord.id,
        filename: videoRecord.filename,
        filepath: videoRecord.filepath,
        duration: videoRecord.duration,
        message: 'Video uploaded successfully',
      });
    } catch (dbError) {
      console.error('❌ ERROR creating database record:', dbError);
      
      // Delete the file if database fails
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filepath);
        console.log('🗑️ Deleted file after database error');
      } catch (deleteError) {
        console.error('❌ ERROR deleting file:', deleteError);
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('❌ ===== UPLOAD ERROR =====');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to upload video',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}