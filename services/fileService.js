const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

class FileService {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
  }

  // Initialize upload directories
  async initializeDirectories() {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, 'logos'),
      path.join(this.uploadPath, 'invoices'),
      path.join(this.uploadPath, 'documents'),
      path.join(this.uploadPath, 'temp')
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch (error) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    }
  }

  // Multer configuration for logo uploads
  getLogoUploadConfig() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const logoDir = path.join(this.uploadPath, 'logos');
        await this.ensureDirectoryExists(logoDir);
        cb(null, logoDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `logo-${uniqueSuffix}${ext}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (this.allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, GIF, WebP)'));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  // Process uploaded logo
  async processLogo(filePath, options = {}) {
    try {
      const {
        width = 200,
        height = 200,
        quality = 85,
        format = 'png'
      } = options;

      const outputPath = filePath.replace(
        path.extname(filePath),
        `-processed.${format}`
      );

      const image = sharp(filePath);
      const metadata = await image.metadata();

      // Resize with aspect ratio preservation
      let processedImage = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Apply format-specific processing
      switch (format) {
        case 'png':
          processedImage = processedImage.png({ quality });
          break;
        case 'jpeg':
        case 'jpg':
          processedImage = processedImage.jpeg({ quality });
          break;
        case 'webp':
          processedImage = processedImage.webp({ quality });
          break;
      }

      await processedImage.toFile(outputPath);

      // Get final dimensions
      const finalMetadata = await sharp(outputPath).metadata();

      // Clean up original file
      await fs.unlink(filePath);

      return {
        success: true,
        path: outputPath,
        originalDimensions: {
          width: metadata.width,
          height: metadata.height
        },
        finalDimensions: {
          width: finalMetadata.width,
          height: finalMetadata.height
        },
        fileSize: (await fs.stat(outputPath)).size,
        format: finalMetadata.format
      };
    } catch (error) {
      console.error('خطأ في معالجة الشعار:', error);
      
      // Clean up on error
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('خطأ في حذف الملف:', unlinkError);
      }
      
      throw new Error(`فشل في معالجة الشعار: ${error.message}`);
    }
  }

  // Get optimal logo dimensions for PDF
  calculateOptimalLogoDimensions(originalWidth, originalHeight, maxWidth = 150, maxHeight = 100) {
    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth = Math.min(originalWidth, maxWidth);
    let newHeight = newWidth / aspectRatio;
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }
    
    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
      aspectRatio
    };
  }

  // Save file with validation
  async saveFile(buffer, filename, directory = 'documents') {
    try {
      const uploadDir = path.join(this.uploadPath, directory);
      await this.ensureDirectoryExists(uploadDir);
      
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        path: filePath,
        filename,
        fileSize: stats.size,
        directory
      };
    } catch (error) {
      console.error('خطأ في حفظ الملف:', error);
      throw new Error(`فشل في حفظ الملف: ${error.message}`);
    }
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return {
        success: true,
        message: 'تم حذف الملف بنجاح'
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: true,
          message: 'الملف غير موجود'
        };
      }
      
      console.error('خطأ في حذف الملف:', error);
      throw new Error(`فشل في حذف الملف: ${error.message}`);
    }
  }

  // Get file info
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      let fileType = 'unknown';
      if (this.allowedImageTypes.some(type => type.includes(ext.substring(1)))) {
        fileType = 'image';
      } else if (this.allowedDocumentTypes.some(type => type.includes(ext.substring(1)))) {
        fileType = 'document';
      }
      
      return {
        exists: true,
        path: filePath,
        filename: path.basename(filePath),
        extension: ext,
        fileType,
        fileSize: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          exists: false,
          path: filePath,
          error: 'الملف غير موجود'
        };
      }
      
      throw new Error(`فشل في قراءة معلومات الملف: ${error.message}`);
    }
  }

  // Clean up old files
  async cleanupOldFiles(directory, maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    try {
      const dirPath = path.join(this.uploadPath, directory);
      const files = await fs.readdir(dirPath);
      const now = Date.now();
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      return {
        success: true,
        deletedCount,
        message: `تم حذف ${deletedCount} ملف قديم`
      };
    } catch (error) {
      console.error('خطأ في تنظيف الملفات:', error);
      throw new Error(`فشل في تنظيف الملفات: ${error.message}`);
    }
  }

  // Ensure directory exists
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Generate secure filename
  generateSecureFilename(originalName, prefix = '') {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const sanitizedName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .substring(0, 50);
    
    return `${prefix}${sanitizedName}-${timestamp}-${random}${ext}`;
  }

  // Get file URL for serving
  getFileUrl(filePath, baseUrl = '') {
    const relativePath = path.relative(this.uploadPath, filePath);
    return `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
  }
}

const fileService = new FileService();

// Initialize directories on startup
fileService.initializeDirectories().catch(console.error);

module.exports = fileService;