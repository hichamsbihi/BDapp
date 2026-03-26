import { Share, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Story } from '@/types';

const SHARE_MESSAGE =
  "Découvre cette histoire magique créée avec MangaKids ! " +
  "Chaque aventure est unique, chaque page est illustrée par la magie de l'IA. 📖✨";

function sanitizeFilename(title: string): string {
  return (
    title
      .replace(/[^a-zA-Z0-9\u00C0-\u017F\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50) || 'Histoire'
  );
}

export const generateStoryPdf = async (story: Story, heroName?: string): Promise<string> => {
  const totalPages = story.pages.length;

  const pagesHtml = story.pages
.map((page)=>`
<div class="page">

  <div class="image-container">
    <img src="${page.imageUrl}" class="page-image"/>
  </div>

  <div class="paragraph">
    ${escapeHtml(page.paragraphText)}
  </div>

  <div class="page-footer">
    Page ${page.pageNumber} / ${totalPages}
  </div>

</div>
`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />

<style>

@page {
  size: 595px 842px;
  margin: 0;
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

html,body{
  width:595px;
  margin:0;
  padding:0;
  overflow:hidden;
  font-family: Georgia, serif;
  background:#FFFCF5;
  color:#3D3229;
}

/* COVER */

.cover{
  width:595px;
  height:842px;
  position:relative;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  align-items:center;
  text-align:center;
  page-break-after:always;
  padding:0;
  overflow:hidden;
}

.cover-image{
  position:absolute;
  top:0;
  left:0;
  width:595px;
  height:842px;
  object-fit:cover;
}

.cover-overlay{
  position:relative;
  z-index:1;
  width:100%;
  background:linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, transparent 100%);
  padding:40px 40px 48px;
  display:flex;
  flex-direction:column;
  align-items:center;
}

.cover-title{
  font-size:38px;
  font-weight:700;
  color:#FFFFFF;
  margin-bottom:12px;
  text-shadow:0 2px 12px rgba(0,0,0,0.4);
}

.cover-author{
  font-size:16px;
  color:#FFD6C0;
  margin-bottom:8px;
}

.cover-label{
  font-size:14px;
  color:rgba(255,255,255,0.7);
  font-style:italic;
}

.cover-footer{
  margin-top:16px;
  font-size:12px;
  color:rgba(255,255,255,0.5);
  letter-spacing:1px;
}

/* PAGE LAYOUT */

.page{
  width:595px;
  height:842px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:flex-start;
  padding:40px 40px 30px;
  page-break-before:always;
}

/* IMAGE */

.image-container{
  flex:1;
  width:100%;
  display:flex;
  align-items:center;
  justify-content:center;
}

.page-image{
  max-width:515px;
  max-height:520px;
  width:auto;
  height:auto;
  object-fit:contain;
  border-radius:12px;
  box-shadow:0 4px 16px rgba(0,0,0,0.10);
}

/* TEXT */

.paragraph{
  flex-shrink:0;
  max-width:480px;
  font-size:15px;
  line-height:1.8;
  text-align:center;
  color:#4A3F32;
  padding:20px 20px;
  margin-top:16px;
  background:#F5EBE0;
  border-radius:10px;
}

/* FOOTER */

.page-footer{
  flex-shrink:0;
  font-size:10px;
  color:#9A8B7A;
  letter-spacing:1.5px;
  text-transform:uppercase;
  margin-top:12px;
  padding-top:8px;
  border-top:1px solid #E8E0D5;
  width:120px;
  text-align:center;
}

</style>
</head>

<body>

<div class="cover">
  <img src="${story.pages[0]?.imageUrl || ''}" class="cover-image"/>
  <div class="cover-title">${escapeHtml(story.title)}</div>
  <div class="cover-subtitle">Une histoire MangaKids</div>
  <div class="cover-label">
    ${totalPages} page${totalPages > 1 ? 's' : ''} illustrée${totalPages > 1 ? 's' : ''}
  </div>
  <div class="cover-footer">Créé avec MangaKids ✨</div>
</div>

${pagesHtml}

</body>
</html>
`;

  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });

  return uri;
};

export const exportAndSharePdf = async (story: Story, heroName?: string): Promise<string> => {
  const tempUri = await generateStoryPdf(story, heroName);

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}