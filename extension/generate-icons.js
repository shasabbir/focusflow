// Icon generator for FocusFlow extension
// This script creates simple icon files using Canvas API

function createIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background circle
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Timer icon (clock-like)
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.lineWidth = size / 16;
  ctx.lineCap = 'round';
  
  // Clock face
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Hour hand
  ctx.beginPath();
  ctx.moveTo(size/2, size/2);
  ctx.lineTo(size/2, size/2 - size/5);
  ctx.stroke();
  
  // Minute hand
  ctx.beginPath();
  ctx.moveTo(size/2, size/2);
  ctx.lineTo(size/2 + size/6, size/2);
  ctx.stroke();
  
  // Center dot
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/32, 0, 2 * Math.PI);
  ctx.fill();
  
  return canvas.toDataURL('image/png');
}

// Generate icons
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
  const iconData = createIcon(size);
  
  // For actual use, you would save these files
  // This is just a demonstration of how the icons would look
  console.log(`Icon ${size}x${size} generated`);
  
  // Create a download link (for manual saving)
  const link = document.createElement('a');
  link.download = `icon-${size}.png`;
  link.href = iconData;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
