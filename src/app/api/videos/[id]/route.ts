// src/app/api/videos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        analytics: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Calculate average completion rate
    const avgCompletion = video.analytics.length > 0
      ? video.analytics.reduce((sum, a) => sum + a.completionRate, 0) / video.analytics.length
      : 0;

    return NextResponse.json({
      id: video.id,
      filename: video.filename,
      filepath: video.filepath,
      duration: video.duration,
      views: video.views,
      avgCompletion: Math.round(avgCompletion),
      createdAt: video.createdAt,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}