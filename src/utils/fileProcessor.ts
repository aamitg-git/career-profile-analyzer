import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface FileUploadResult {
  text: string;
  filename: string;
  error?: string;
}

export class FileProcessor {
  static async processFile(file: File): Promise<FileUploadResult> {
    const filename = file.name;
    const fileType = file.type.toLowerCase();
    const fileExtension = filename.split('.').pop()?.toLowerCase();

    try {
      if (fileType === 'text/plain' || fileExtension === 'txt') {
        const text = await this.readTextFile(file);
        return { text, filename };
      }
      
      if (fileType === 'application/pdf' || fileExtension === 'pdf') {
        const text = await this.readPdfFile(file);
        return { text, filename };
      }
      
      if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword' ||
        fileExtension === 'docx' ||
        fileExtension === 'doc'
      ) {
        const text = await this.readWordFile(file);
        return { text, filename };
      }

      return {
        text: '',
        filename,
        error: 'Unsupported file type. Please upload a PDF, Word document, or text file.'
      };
    } catch (error) {
      console.error('File processing error:', error);
      return {
        text: '',
        filename,
        error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  private static async readPdfFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  }

  private static async readWordFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
}