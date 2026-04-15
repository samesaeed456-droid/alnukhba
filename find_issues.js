const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const issues = [];

walk('./src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check for buttons without onClick or type="submit"
  if (filePath.endsWith('.tsx')) {
    lines.forEach((line, i) => {
      if (line.includes('<button') && !line.includes('onClick') && !line.includes('type="submit"')) {
        // Check if onClick is on the next few lines
        let hasOnClick = false;
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].includes('onClick') || lines[j].includes('type="submit"')) {
            hasOnClick = true;
            break;
          }
        }
        if (!hasOnClick) {
          issues.push(`[زر بدون وظيفة] -> [في ملف ${filePath} السطر ${i + 1}] -> [إضافة onClick أو type="submit"]`);
        }
      }
    });
  }
});

console.log(issues.join('\n'));
