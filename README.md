Mini Loom – Screen Recorder & Sharing Platform

A lightweight browser-based screen recording platform built with Next.js that allows users to record their screen with audio, trim the recording, upload it, and share it via a unique public link. Includes analytics for view counts and video completion rates.

Project Overview

This application is a mini screen recording and video sharing system similar in concept to Loom.

Users can:

Record their screen and microphone directly in the browser

Trim the recording before upload

Upload and generate a public share link

Track video engagement using analytics

This project demonstrates browser APIs, media handling, video processing, backend systems, and product-level features in a full-stack application.

Features
Recording

Screen capture using WebRTC (getDisplayMedia)

Microphone audio capture (getUserMedia)

Start and stop recording controls

Output saved as .webm

Video Trimming

Client-side trimming using FFmpeg.wasm

Select start and end times

Export trimmed video without server processing

Upload and Sharing

Upload processed video to server storage

Generate unique public share link:

/share/:videoId


Public page with embedded video player

Analytics

Track total views per video

Track average completion percentage

Data persists using database storage

Real-Time Feedback

Recording state indicators

Processing (trimming) status

Upload progress feedback

Tech Stack
Layer	Technology
Frontend	Next.js (App Router) + TypeScript
Styling	Tailwind CSS
Media Recording	WebRTC + MediaRecorder API
Video Processing	FFmpeg.wasm (client-side)
Backend APIs	Next.js API Routes
Database	Prisma ORM + SQLite (Development) / PostgreSQL (Production)
File Storage	Local file system (Development) – Cloud storage ready
Analytics	Custom event tracking APIs
Installation and Setup
1. Clone the Repository
git clone <your-repository-url>
cd miniloom-next

2. Install Dependencies
npm install

3. Environment Variables

Create a .env file:

DATABASE_URL="file:./dev.db"

4. Setup Database
npx prisma generate
npx prisma db push

5. Run Development Server
npm run dev


Open in browser:
http://localhost:3000

Architecture Highlights
Client-Side Video Processing

Trimming is performed in the browser using FFmpeg.wasm.

Benefits:

Reduces server load and cost

Improves privacy

Instant processing for short videos

Blob-Based Preview System

Videos are previewed using blob URLs before upload.

const url = URL.createObjectURL(videoBlob);

Data Flow
Record → Blob → Preview → Trim → Upload → Database Entry → Share Link → Analytics Tracking

Database Schema (Core)
model Video {
  id        String   @id @default(cuid())
  filename  String
  filepath  String
  duration  Float
  createdAt DateTime @default(now())
  views     Int      @default(0)
  analytics Analytics[]
}

Production Improvements (Planned)

Cloud storage integration (S3, R2, etc.)

PostgreSQL migration

Authentication and authorization

CDN integration

Server-side video processing pipeline

Rate limiting

Monitoring and logging

Testing infrastructure

Security hardening

Useful Commands
npm run dev        # Start development server
npm run build      # Build for production
npx prisma studio  # Open database UI
npm run lint       # Run linter

What This Project Demonstrates

Advanced browser APIs

Media recording and encoding

Client-side video processing

Full-stack API integration

Persistent analytics systems

Product-focused system design

License

Add your license here.

Author

Built by Abhayadev P using Next.js, Prisma, and FFmpeg.wasm.