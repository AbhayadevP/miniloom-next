// src/lib/ffmpeg.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export async function trimVideo(
  videoFile: File,
  startTime: number,
  endTime: number
): Promise<Blob> {
  const ffmpegInstance = await loadFFmpeg();

  const inputFileName = 'input.webm';
  const outputFileName = 'output.webm';

  // Write input file to FFmpeg's virtual file system
  const arrayBuffer = await videoFile.arrayBuffer();
  await ffmpegInstance.writeFile(inputFileName, new Uint8Array(arrayBuffer));

  // Calculate duration
  const duration = endTime - startTime;

  // Run FFmpeg trim command
  await ffmpegInstance.exec([
    '-i', inputFileName,
    '-ss', startTime.toString(),
    '-t', duration.toString(),
    '-c', 'copy',
    outputFileName
  ]);

  // Read the output file
  const data = await ffmpegInstance.readFile(outputFileName);
  
  // Clean up
  await ffmpegInstance.deleteFile(inputFileName);
  await ffmpegInstance.deleteFile(outputFileName);

  return new Blob([data], { type: 'video/webm' });
}