import { Share, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Story } from '@/types';

const SHARE_MESSAGE =
  "Decouvre cette histoire magique creee avec MangaKids ! " +
  "Chaque aventure est unique, chaque page est illustree par la magie de l'IA.";

function sanitizeFilename(title: string): string {
  return (
    title
      .replace(/[^a-zA-Z0-9\u00C0-\u017F\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50) || 'Histoire'
  );
}

export const generateStoryPdf = async (story: Story): Promise<string> => {
  const totalPages = story.pages.length;

  const pagesHtml = story.pages
    .map(
      (page, index) => `
      <div class="page ${index > 0 ? 'page-break' : ''}">
        <div class="image-container">
          <img src="${page.imageUrl}" class="page-image"/>
        </div>

        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-dot"></span>
          <span class="divider-line"></span>
        </div>

        <p class="paragraph">${escapeHtml(page.paragraphText)}</p>

        <div class="page-footer">
          Page ${page.pageNumber} / ${totalPages}
        </div>
      </div>
    `
    )
    .join('');

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
  height:842px;
  font-family: Georgia, serif;
  background:#FFFCF5;
  color:#3D3229;
}

/* COVER */

.cover{
  width:595px;
  height:842px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  text-align:center;
  page-break-after:always;
  padding:60px;
}

.cover-title{
  font-size:36px;
  font-weight:700;
  margin-bottom:20px;
}

.cover-subtitle{
  font-size:18px;
  color:#8E7F70;
}

/* PAGE */

.page{
  width:595px;
  height:842px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:flex-start;
  padding:30px;
}

.page-break{
  page-break-before:always;
}

/* IMAGE */

.image-container{
  width:100%;
  display:flex;
  justify-content:center;
  align-items:center;
}

.page-image{
  width:100%;
  height:auto;
  max-height:520px;
  object-fit:contain;
  border-radius:10px;
}

/* TEXT BLOCK */

.paragraph{
  margin-top:25px;
  font-size:16px;
  line-height:1.7;
  text-align:center;
  max-width:480px;
  padding:18px 22px;
  background:#FFF8ED;
  border-radius:10px;
}

/* FOOTER */

.page-footer{
  margin-top:auto;
  font-size:11px;
  color:#B8A99A;
  letter-spacing:1px;
}

</style>
</head>

<body>

<div class="cover">
  <div class="cover-title">${escapeHtml(story.title)}</div>
  <div class="cover-decoration"></div>
  <div class="cover-subtitle">
    ${totalPages} page${totalPages > 1 ? 's' : ''}
  </div>
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

export const exportAndSharePdf = async (story: Story): Promise<string> => {
  const tempUri = await generateStoryPdf(story);

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