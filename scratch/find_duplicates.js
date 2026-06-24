const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/context/translations.js');
const content = fs.readFileSync(filePath, 'utf8');

// A simple regex parser or evaluating the exported object to find duplicate keys
// We'll parse the file line by line and track key occurrences within en: { ... } and mn: { ... }
const lines = content.split('\n');
let currentBlock = null;
const keys = { en: {}, mn: {} };

lines.forEach((line, index) => {
  if (line.includes('en: {')) {
    currentBlock = 'en';
  } else if (line.includes('mn: {')) {
    currentBlock = 'mn';
  } else if (line.trim() === '}' || line.trim() === '},' || line.trim() === '};') {
    // block end (approximate)
  }

  if (currentBlock) {
    const match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) {
      const key = match[1];
      if (keys[currentBlock][key]) {
        keys[currentBlock][key].push(index + 1);
      } else {
        keys[currentBlock][key] = [index + 1];
      }
    }
  }
});

console.log("Duplicate keys in 'en':");
for (const [key, linesList] of Object.entries(keys.en)) {
  if (linesList.length > 1) {
    console.log(`  - Key "${key}" found on lines: ${linesList.join(', ')}`);
  }
}

console.log("\nDuplicate keys in 'mn':");
for (const [key, linesList] of Object.entries(keys.mn)) {
  if (linesList.length > 1) {
    console.log(`  - Key "${key}" found on lines: ${linesList.join(', ')}`);
  }
}
