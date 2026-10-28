export interface ExtractedPage {
  pageOrSlideNumber: number;
  text: string;
}

export interface ExtractedDocument {
  title: string;
  fileType: 'pdf' | 'pptx' | 'txt';
  pages: ExtractedPage[];
  fullText: string;
  totalCharacters: number;
  totalCount: number;
}

export class DocumentExtractor {
  /**
   * Extract plain text files (.txt, .md, .csv)
   */
  public extractTxt(buffer: Buffer, fileName: string): ExtractedDocument {
    const text = buffer.toString('utf-8');
    // Split by sections or paragraphs if possible
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const pages: ExtractedPage[] = [];

    if (paragraphs.length > 0) {
      // Group every 3-4 paragraphs into logical "pages" or sections
      let currentSection = '';
      let pageNum = 1;

      for (let i = 0; i < paragraphs.length; i++) {
        currentSection += (currentSection ? '\n\n' : '') + paragraphs[i];
        if (currentSection.length > 1500 || i === paragraphs.length - 1) {
          pages.push({
            pageOrSlideNumber: pageNum++,
            text: currentSection.trim(),
          });
          currentSection = '';
        }
      }
    } else {
      pages.push({
        pageOrSlideNumber: 1,
        text: text.trim(),
      });
    }

    const title = fileName.replace(/\.[^/.]+$/, '');
    return {
      title,
      fileType: 'txt',
      pages,
      fullText: text,
      totalCharacters: text.length,
      totalCount: pages.length,
    };
  }

  /**
   * Extract PDF files using pdf-parse with page tracking
   */
  public async extractPdf(buffer: Buffer, fileName: string): Promise<ExtractedDocument> {
    const title = fileName.replace(/\.[^/.]+$/, '');
    try {
      // Dynamic import to handle ESM/CJS interop cleanly
      const pdfModule = await import('pdf-parse');
      const pdfParse = (pdfModule as any).default || pdfModule;

      const pageTexts: string[] = [];

      // Custom page renderer to capture page-by-page text
      const options = {
        pagerender: (pageData: any) => {
          return pageData.getTextContent().then((textContent: any) => {
            let lastY: number | null = null;
            let text = '';
            for (const item of textContent.items) {
              if (lastY === item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            pageTexts.push(text);
            return text;
          });
        },
      };

      const data = await pdfParse(buffer, options);
      const pages: ExtractedPage[] = [];

      if (pageTexts.length > 0) {
        pageTexts.forEach((pText, idx) => {
          if (pText.trim().length > 0) {
            pages.push({
              pageOrSlideNumber: idx + 1,
              text: pText.trim(),
            });
          }
        });
      }

      // Fallback if custom pagerender didn't populate
      if (pages.length === 0) {
        const fullText = data.text || '';
        // Split by page form feed characters if present
        const parts = fullText.split(/\f/);
        parts.forEach((part: string, idx: number) => {
          if (part.trim().length > 0) {
            pages.push({
              pageOrSlideNumber: idx + 1,
              text: part.trim(),
            });
          }
        });

        if (pages.length === 0 && fullText.trim().length > 0) {
          pages.push({
            pageOrSlideNumber: 1,
            text: fullText.trim(),
          });
        }
      }

      const fullText = pages.map((p) => p.text).join('\n\n');
      return {
        title,
        fileType: 'pdf',
        pages,
        fullText,
        totalCharacters: fullText.length,
        totalCount: data.numpages || pages.length,
      };
    } catch (err: any) {
      console.warn('PDF parser encountered error, attempting raw text recovery:', err.message);
      // Fallback: extract ASCII strings from PDF stream
      const rawString = buffer.toString('latin1');
      const extractedText = rawString
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        title,
        fileType: 'pdf',
        pages: [{ pageOrSlideNumber: 1, text: extractedText.substring(0, 10000) }],
        fullText: extractedText.substring(0, 10000),
        totalCharacters: extractedText.length,
        totalCount: 1,
      };
    }
  }

  /**
   * Extract PPTX files (extract slide text from XML structures)
   */
  public async extractPptx(buffer: Buffer, fileName: string): Promise<ExtractedDocument> {
    const title = fileName.replace(/\.[^/.]+$/, '');
    const pages: ExtractedPage[] = [];

    try {
      // PPTX is a zip archive. We can scan for slide texts or text nodes
      const content = buffer.toString('utf-8');
      // Look for XML tags <a:t>...</a:t> (PowerPoint text elements)
      const slideMatches = content.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || [];
      const textMatches = content.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];

      let combinedText = '';
      if (textMatches.length > 0) {
        const words = textMatches
          .map((m) => m.replace(/<[^>]+>/g, '').trim())
          .filter((w) => w.length > 0);
        
        // Chunk into artificial slides of ~100 words
        let currentSlide = '';
        let slideIndex = 1;

        for (let i = 0; i < words.length; i++) {
          currentSlide += ' ' + words[i];
          if (currentSlide.length > 500 || i === words.length - 1) {
            pages.push({
              pageOrSlideNumber: slideIndex++,
              text: currentSlide.trim(),
            });
            currentSlide = '';
          }
        }
        combinedText = pages.map((p) => p.text).join('\n\n');
      }

      if (pages.length === 0) {
        // Fallback: string clean
        const clean = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
        pages.push({
          pageOrSlideNumber: 1,
          text: clean.substring(0, 5000),
        });
        combinedText = pages[0].text;
      }

      return {
        title,
        fileType: 'pptx',
        pages,
        fullText: combinedText,
        totalCharacters: combinedText.length,
        totalCount: pages.length,
      };
    } catch (err: any) {
      console.warn('PPTX parsing error:', err.message);
      return {
        title,
        fileType: 'pptx',
        pages: [{ pageOrSlideNumber: 1, text: `Extracted slide deck: ${title}` }],
        fullText: `Extracted slide deck: ${title}`,
        totalCharacters: 100,
        totalCount: 1,
      };
    }
  }

  public async extract(buffer: Buffer, fileName: string): Promise<ExtractedDocument> {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return this.extractPdf(buffer, fileName);
    } else if (ext === 'pptx' || ext === 'ppt') {
      return this.extractPptx(buffer, fileName);
    } else {
      return this.extractTxt(buffer, fileName);
    }
  }
}

export const documentExtractor = new DocumentExtractor();
