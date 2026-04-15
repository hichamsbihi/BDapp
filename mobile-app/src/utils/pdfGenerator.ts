import { Share, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Story } from '@/types';
import { fetchUniverseById } from '@/services/storyService';

const SHARE_MESSAGE =
  "Découvre cette histoire magique créée avec MangaKids ! " +
  "Chaque aventure est unique, chaque page est illustrée par la magie de l'IA.";

// A4 in points
const PW = 595;
const PH = 842;

function sanitizeFilename(title: string): string {
  return (
    title
      .replace(/[^a-zA-Z0-9\u00C0-\u017F\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50) || 'Histoire'
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toImageMimeType(url: string): string {
  const source = url.toLowerCase();
  if (source.includes('.png')) return 'image/png';
  if (source.includes('.webp')) return 'image/webp';
  if (source.includes('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function toDataUri(url?: string): Promise<string | null> {
  if (!url) return null;

  const cacheDir = FileSystemLegacy.cacheDirectory;
  if (!cacheDir) return null;

  const fileId = `pdf-img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tempPath = `${cacheDir}${fileId}`;

  try {
    await FileSystemLegacy.downloadAsync(url, tempPath);
    const base64 = await FileSystemLegacy.readAsStringAsync(tempPath, {
      encoding: FileSystemLegacy.EncodingType.Base64,
    });
    return `data:${toImageMimeType(url)};base64,${base64}`;
  } catch {
    return null;
  } finally {
    try {
      await FileSystemLegacy.deleteAsync(tempPath, { idempotent: true });
    } catch {
      // Ignore cleanup failure
    }
  }
}

interface PdfOptions {
  story: Story;
  heroName?: string;
}

export const generateStoryPdf = async ({
  story,
  heroName,
}: PdfOptions): Promise<string> => {
  const totalPages = story.pages.length;
  let universeCoverUrl: string | undefined;
  try {
    // Source of truth for the cover is universes.image_url in Supabase.
    const universe = await fetchUniverseById(story.universeId);
    if (universe?.imageUrl) {
      universeCoverUrl = universe.imageUrl;
    }
  } catch {
    // Keep fallback path if universe query fails.
  }
  // Convert to base64 to avoid remote image rendering issues in print engine.
  const coverBg =
    (await toDataUri(universeCoverUrl)) ||
    (await toDataUri(story.pages[0]?.imageUrl)) ||
    '';
  const authorLabel = heroName
    ? `Ecrit par ${heroName}`
    : 'Ecrit par un jeune auteur';

  const pagesHtml = story.pages
    .map(
      (page) => `
<div class="page">
  <div class="img-zone">
    <div class="img-frame">
      <img src="${page.imageUrl}"/>
    </div>
  </div>
  <div class="txt-zone">
    <p>${escapeHtml(page.paragraphText)}</p>
  </div>
  <div class="pg-num">Page ${page.pageNumber} / ${totalPages}</div>
</div>`
    )
    .join('');

  // viewport meta forces WebKit to use exactly PW as the layout width,
  // which fixes the right-shift on iOS expo-print.
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=${PW}, initial-scale=1, maximum-scale=1"/>
<style>
@page { size:${PW}px ${PH}px; margin:0; }
*{ margin:0; padding:0; box-sizing:border-box; }

html, body{
  width:${PW}px;
  height:100%;
  margin:0;
  padding:0;
  font-family: Georgia, 'Times New Roman', serif;
  background:#FFFCF5;
  color:#3D3229;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

/* ---------- COVER (full bleed like a real book) ---------- */

.cover{
  width:${PW}px;
  height:${PH}px;
  position:relative;
  overflow:hidden;
  page-break-after:always;
  background:#1A1625;
}

.cover-bg{
  position:absolute;
  top:0; left:0;
  width:${PW}px;
  height:${PH}px;
  object-fit:cover;
  object-position:center center;
  display:block;
}

.cover-grad{
  position:absolute;
  top:0; left:0;
  width:${PW}px;
  height:${PH}px;
  background:linear-gradient(
    180deg,
    transparent 0%,
    transparent 35%,
    rgba(0,0,0,0.25) 55%,
    rgba(0,0,0,0.72) 85%,
    rgba(0,0,0,0.88) 100%
  );
}

.cover-txt{
  position:absolute;
  bottom:52px;
  left:0; right:0;
  text-align:center;
  padding:0 44px;
}

.c-title{
  font-size:40px;
  font-weight:800;
  color:#fff;
  line-height:1.18;
  margin-bottom:14px;
  text-shadow:0 2px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4);
}

.c-author{
  font-size:18px;
  font-weight:600;
  color:#FFD6C0;
  margin-bottom:10px;
  text-shadow:0 2px 8px rgba(0,0,0,0.5);
}

.c-meta{
  font-size:13px;
  color:rgba(255,255,255,0.7);
  font-style:italic;
  margin-bottom:20px;
}

.c-brand{
  display:inline-block;
  font-size:10px;
  color:rgba(255,255,255,0.45);
  letter-spacing:3px;
  text-transform:uppercase;
  border-top:1px solid rgba(255,255,255,0.18);
  padding-top:10px;
}

/* ---------- STORY PAGES ---------- */

.page{
  width:${PW}px;
  height:${PH}px;
  position:relative;
  page-break-before:always;
  overflow:hidden;
}

/* Image: 70% of usable height */
.img-zone{
  position:absolute;
  top:24px;
  left:0; right:0;
  height:560px;
}

.img-frame{
  position:absolute;
  top:0;
  left:0;
  right:0;
  margin:0 auto;
  width:515px;
  height:560px;
}
.img-zone img{
  display:block;
  width:100%;
  height:100%;
  object-fit:contain;
  border-radius:14px;
  box-shadow:0 4px 20px rgba(0,0,0,0.08);
}

/* Text: 30% of usable height */
.txt-zone{
  position:absolute;
  top:596px;
  left:0;
  right:0;
  margin:0 auto;
  width:515px;
  bottom:50px;
  text-align:center;
}
.txt-zone p{
  display:block;
  width:100%;
  font-size:14px;
  line-height:1.7;
  color:#4A3F32;
  background:#F5EBE0;
  border-radius:10px;
  padding:14px 22px;
  text-align:center;
}

.pg-num{
  position:absolute;
  bottom:18px;
  left:0; right:0;
  text-align:center;
  font-size:9px;
  color:#9A8B7A;
  letter-spacing:1.5px;
  text-transform:uppercase;
}
</style>
</head>
<body>

<div class="cover">
  <img class="cover-bg" src="${coverBg}"/>
  <div class="cover-grad"></div>
  <div class="cover-txt">
    <div class="c-title">${escapeHtml(story.title)}</div>
    <div class="c-author">${escapeHtml(authorLabel)}</div>
    <div class="c-meta">${totalPages} page${totalPages > 1 ? 's' : ''} illustree${totalPages > 1 ? 's' : ''}</div>
    <span class="c-brand">MangaKids</span>
  </div>
</div>

${pagesHtml}

</body>
</html>`;

  const { uri } = await Print.printToFileAsync({
    html,
    width: PW,
    height: PH,
  });

  return uri;
};

export const exportAndSharePdf = async (
  story: Story,
  heroName?: string
): Promise<string> => {
  const tempUri = await generateStoryPdf({ story, heroName });
  const fileName = `${sanitizeFilename(story.title)}.pdf`;

  const tempFile = new File(tempUri);
  const namedFile = new File(Paths.cache, fileName);

  if (namedFile.exists) {
    namedFile.delete();
  }

  tempFile.copy(namedFile);

  if (Platform.OS === 'ios') {
    await Share.share({
      message: SHARE_MESSAGE,
      url: namedFile.uri,
      title: story.title,
    });
  } else {
    await Sharing.shareAsync(namedFile.uri, {
      mimeType: 'application/pdf',
      dialogTitle: SHARE_MESSAGE,
    });
  }

  return namedFile.uri;
};
