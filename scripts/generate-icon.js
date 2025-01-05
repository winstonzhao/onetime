const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateIco() {
  const sizes = [16, 24, 32, 48, 64, 128];
  const pngBuffers = await Promise.all(
    sizes.map(size => 
      sharp(path.join(__dirname, '../public/icon.svg'))
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // Create ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(sizes.length, 4); // Number of images

  // Create directory entries
  const directories = Buffer.alloc(16 * sizes.length);
  let offset = header.length + directories.length;

  // Concatenate all PNG buffers
  const imageBuffers = Buffer.concat(pngBuffers);

  // Fill directory entries
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const imageSize = pngBuffers[i].length;

    directories.writeUInt8(size === 256 ? 0 : size, i * 16); // Width
    directories.writeUInt8(size === 256 ? 0 : size, i * 16 + 1); // Height
    directories.writeUInt8(0, i * 16 + 2); // Color palette
    directories.writeUInt8(0, i * 16 + 3); // Reserved
    directories.writeUInt16LE(1, i * 16 + 4); // Color planes
    directories.writeUInt16LE(32, i * 16 + 6); // Bits per pixel
    directories.writeUInt32LE(imageSize, i * 16 + 8); // Image size
    directories.writeUInt32LE(offset, i * 16 + 12); // Image offset

    offset += imageSize;
  }

  // Combine all buffers
  const icoBuffer = Buffer.concat([header, directories, imageBuffers]);

  // Write to file
  await fs.writeFile(path.join(__dirname, '../public/icon.ico'), icoBuffer);
  console.log('Icon generated successfully!');
}

generateIco().catch(console.error);
