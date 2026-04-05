const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const original = fs.readFileSync(fullPath, 'utf8');
      
      let modified = original
        .replace(/font-sora/g, 'font-dmserif')
        .replace(/bg-indigo-500/g, 'bg-brand')
        .replace(/text-indigo-300/g, 'text-accent')
        .replace(/text-indigo-400/g, 'text-brand')
        .replace(/text-indigo-500/g, 'text-brand')
        .replace(/text-indigo-600/g, 'text-brand')
        .replace(/from-indigo-400/g, 'from-brand')
        .replace(/from-indigo-500/g, 'from-brand')
        .replace(/to-violet-500/g, 'to-accent')
        .replace(/to-violet-600/g, 'to-accent')
        .replace(/focus:ring-indigo-500/g, 'focus:ring-brand')
        .replace(/focus:border-indigo-500/g, 'focus:border-brand');
        
      if (original !== modified) {
        fs.writeFileSync(fullPath, modified);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
console.log('Complete!');
