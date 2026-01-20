#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = './src/assets';
const MAX_WIDTH = 1920;
const QUALITY = 80;

async function optimizeImages() {
  console.log('🖼️  Optimizing images...\n');
  
  const files = fs.readdirSync(ASSETS_DIR);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  
  let totalSaved = 0;
  
  for (const file of imageFiles) {
    const filePath = path.join(ASSETS_DIR, file);
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;
    
    // Skip if already small (< 500KB)
    if (originalSize < 500 * 1024) {
      console.log(`⏭️  Skipping ${file} (already optimized: ${(originalSize / 1024).toFixed(0)}KB)`);
      continue;
    }
    
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      // Create optimized version
      let pipeline = image;
      
      // Resize if too wide
      if (metadata.width > MAX_WIDTH) {
        pipeline = pipeline.resize(MAX_WIDTH, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        });
      }
      
      // Optimize based on format
      const ext = path.extname(file).toLowerCase();
      const outputPath = filePath;
      const tempPath = filePath + '.tmp';
      
      if (ext === '.jpg' || ext === '.jpeg') {
        await pipeline
          .jpeg({ quality: QUALITY, progressive: true })
          .toFile(tempPath);
      } else if (ext === '.png') {
        await pipeline
          .png({ compressionLevel: 9, progressive: true })
          .toFile(tempPath);
      }
      
      const newStats = fs.statSync(tempPath);
      const newSize = newStats.size;
      const saved = originalSize - newSize;
      
      if (saved > 0) {
        fs.renameSync(tempPath, outputPath);
        totalSaved += saved;
        console.log(`✅ ${file}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024 / 1024).toFixed(2)}MB (saved ${(saved / 1024 / 1024).toFixed(2)}MB)`);
      } else {
        fs.unlinkSync(tempPath);
        console.log(`⏭️  ${file}: No size reduction, keeping original`);
      }
    } catch (error) {
      console.error(`❌ Error optimizing ${file}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`);
}

optimizeImages().catch(console.error);
