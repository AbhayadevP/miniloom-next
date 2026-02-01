// src/app/api/videos/[id]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { id } = await context.params;
    
    console.log('🔍 API: Fetching video with ID:', id);

    if (!id) {
      console.error('❌ API: No ID provided');
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Fetch video from database
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        analytics: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!video) {
      console.error('❌ API: Video not found in database:', id);
      return NextResponse.json(
        { error: 'Video not found', videoId: id },
        { status: 404 }
      );
    }

    console.log('✅ API: Video found:', {
      id: video.id,
      filename: video.filename,
      filepath: video.filepath,
      duration: video.duration,
    });

    // Calculate average completion rate
    const avgCompletion = video.analytics.length > 0
      ? video.analytics.reduce((sum, a) => sum + a.completionRate, 0) / video.analytics.length
      : 0;

    const response = {
      id: video.id,
      filename: video.filename,
      filepath: video.filepath,
      duration: video.duration,
      views: video.views,
      avgCompletion: Math.round(avgCompletion),
      createdAt: video.createdAt,
    };

    console.log('📤 API: Sending response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API: Error fetching video:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}