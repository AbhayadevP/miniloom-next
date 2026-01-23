// src/app/api/analytics/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Increment view count
    const video = await prisma.video.update({
      where: { id: videoId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      views: video.views,
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}