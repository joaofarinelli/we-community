/**
 * Converts YouTube URLs to embed format for video playback
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - Already embedded URLs (returns as-is)
 * 
 * @param url The YouTube URL to convert
 * @returns The embed URL or the original URL if not a YouTube URL
 */
export const convertYouTubeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  const trimmedUrl = url.trim();
  
  // If already an embed URL, return as-is
  if (trimmedUrl.includes('youtube.com/embed/') || trimmedUrl.includes('youtu.be/embed/')) {
    return trimmedUrl;
  }

  // Match standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
  const standardMatch = trimmedUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (standardMatch) {
    const videoId = standardMatch[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Match short YouTube URL: https://youtu.be/VIDEO_ID
  const shortMatch = trimmedUrl.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    const videoId = shortMatch[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // If not a YouTube URL or unrecognized format, return original
  return trimmedUrl;
};