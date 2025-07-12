// This is a simple script to generate placeholder icons
// In a real application, you would replace these with actual icons

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon with the text "سُبل"
const createSvgIcon = (size) => {
  const fontSize = Math.floor(size / 3);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#3b82f6" />
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}px" 
      fill="white" text-anchor="middle" dominant-baseline="middle">سُبل</text>
  </svg>`;
};

// List of icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons for each size
sizes.forEach(size => {
  const iconContent = createSvgIcon(size);
  const filePath = path.join(__dirname, `icon-${size}x${size}.svg`);
  
  fs.writeFileSync(filePath, iconContent);
  console.log(`Created icon: ${filePath}`);
});

console.log('Icon generation complete. Convert SVGs to PNGs for production use.');
console.log('For a real application, replace these placeholder icons with actual icons.'); 