// src/app/api/analytics/watch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { videoId, watchedDuration, totalDuration } = await request.json();

    if (!videoId || watchedDuration === undefined || totalDuration === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate completion rate
    const completionRate = (watchedDuration / totalDuration) * 100;

    // Save analytics data
    const analytics = await prisma.analytics.create({
      data: {
        videoId,
        watchedDuration,
        completionRate: Math.min(completionRate, 100), // Cap at 100%
      },
    });

    return NextResponse.json({
      success: true,
      completionRate: Math.round(analytics.completionRate),
    });
  } catch (error) {
    console.error('Error tracking watch:', error);
    return NextResponse.json(
      { error: 'Failed to track watch time' },
      { status: 500 }
    );
  }
}