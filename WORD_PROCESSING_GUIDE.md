# Hướng Dẫn Xử Lý File Word

## Backend - Đọc File Word

### 1. Cài đặt thư viện
```bash
cd backend
npm install mammoth docx
```

### 2. Tạo Service xử lý Word

**File: `backend/src/services/word-processor.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import * as fs from 'fs';

@Injectable()
export class WordProcessorService {
  // Đọc file .docx và chuyển sang HTML
  async convertToHtml(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.convertToHtml({ buffer });
    return result.value;
  }

  // Đọc file .docx và chuyển sang plain text
  async convertToText(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Đọc file .docx và lấy metadata
  async extractMetadata(filePath: string): Promise<any> {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.convertToHtml({ buffer });
    
    return {
      text: result.value,
      messages: result.messages,
      warnings: result.messages.filter(m => m.type === 'warning'),
      errors: result.messages.filter(m => m.type === 'error'),
    };
  }
}
```

### 3. Tạo Controller

**File: `backend/src/controllers/document.controller.ts`**
```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WordProcessorService } from '../services/word-processor.service';

@Controller('documents')
export class DocumentController {
  constructor(private wordProcessor: WordProcessorService) {}

  @Post('upload-word')
  @UseInterceptors(FileInterceptor('file'))
  async uploadWord(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.match(/\.(doc|docx)$/)) {
      throw new BadRequestException('Only Word files are allowed');
    }

    try {
      const text = await this.wordProcessor.convertToText(file.path);
      const html = await this.wordProcessor.convertToHtml(file.path);
      
      return {
        success: true,
        fileName: file.originalname,
        text,
        html,
        size: file.size,
      };
    } catch (error) {
      throw new BadRequestException('Failed to process Word file');
    }
  }
}
```

## Frontend - Upload và Hiển thị

### Component Upload Word

**File: `frontend/src/components/WordUpload.tsx`**
```tsx
'use client';

import { useState } from 'react';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function WordUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState<{ text: string; html: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(doc|docx)$/)) {
        toast.error('Chỉ chấp nhận file Word (.doc, .docx)');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/documents/upload-word', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setContent({ text: data.text, html: data.html });
      toast.success('Đọc file Word thành công!');
    } catch (error) {
      toast.error('Lỗi khi đọc file Word');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
        <div className="flex flex-col items-center gap-4">
          <FileText className="w-12 h-12 text-gray-400" />
          <div className="text-center">
            <label className="cursor-pointer text-blue-600 hover:text-blue-700">
              <span>Chọn file Word</span>
              <input
                type="file"
                accept=".doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-1">
              Hỗ trợ .doc và .docx
            </p>
          </div>
          {file && (
            <div className="text-sm text-gray-600">
              Đã chọn: {file.name}
            </div>
          )}
        </div>
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Đọc file
            </>
          )}
        </button>
      )}

      {content && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">Nội dung (Text):</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {content.text}
            </pre>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">Nội dung (HTML):</h3>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Use Cases

### 1. Import Dữ Liệu từ Word
- Đọc báo cáo doanh thu từ file Word
- Chuyển đổi sang format có thể xử lý
- Import vào database

### 2. Template Processing
- Đọc template Word
- Thay thế placeholders
- Generate báo cáo tự động

### 3. Document Management
- Upload và lưu trữ file Word
- Preview nội dung
- Search trong documents

## Thư Viện Khác

### 1. **mammoth** (Recommended)
```bash
npm install mammoth
```
- Chuyển .docx sang HTML/text
- Giữ được formatting cơ bản
- Dễ sử dụng

### 2. **docx**
```bash
npm install docx
```
- Tạo file Word từ code
- Đọc và chỉnh sửa .docx
- API mạnh mẽ

### 3. **officegen**
```bash
npm install officegen
```
- Generate Word, Excel, PowerPoint
- Không đọc được file

### 4. **textract**
```bash
npm install textract
```
- Extract text từ nhiều format
- Hỗ trợ .doc, .docx, .pdf, etc.

## Lưu Ý

1. **File .doc cũ**: Khó xử lý hơn .docx, cần thư viện khác
2. **Formatting**: Một số format phức tạp có thể bị mất
3. **Images**: Cần xử lý riêng cho hình ảnh trong Word
4. **Tables**: Cần parse đặc biệt cho bảng biểu
5. **Performance**: File lớn có thể chậm, nên xử lý async

## Bạn muốn làm gì với file Word?

Hãy cho tôi biết use case cụ thể để tôi có thể giúp bạn tốt hơn:
- Đọc nội dung text từ Word?
- Import dữ liệu từ Word vào database?
- Generate Word reports từ data?
- Chuyển đổi Word sang PDF?
- Khác?
