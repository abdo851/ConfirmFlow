const YOUTUBE_ID = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function parseYouTubeId(url: string): string | null {
  const match = url.trim().match(YOUTUBE_ID);
  return match?.[1] ?? null;
}

export function youtubeThumbnail(url: string): string | null {
  const id = parseYouTubeId(url);
  if (!id) {
    return null;
  }
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = parseYouTubeId(url);
  if (!id) {
    return null;
  }
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}
