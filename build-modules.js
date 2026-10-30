const fs = require('fs');
const path = require('path');

const moduleDir = '/c/Users/david/OneDrive/Desktop/New Course-20261028T181040Z-1-001/New Course';

const modules = [];
const folderNames = [
  'Module 1. Skills',
  'Module 2. Limitations',
  'Module 3. Blockages',
  'Module 4. Rewiring each blockage',
  'Module 5. Vision',
  'Module 6. Values',
  'Module 7. Finding your passion',
  'Module 8. Passion integration',
  'Module 9. Empathize the pain – Part 1',
  'Module 10. Empathize the pain – Part 2',
  'Module 11. Define the problem - Part 1',
  'Module 12. Define the problem – Part 2',
  'Module 13. Solution matches – Part 1',
  'Module 14. Solution matches – Part 2',
  'Module 15. Prototype and Test – Part 1',
  'Module 16 Prototype and Test - Part 2'
];

folderNames.forEach((folderName, idx) => {
  const i = idx + 1;
  const folderPath = path.join(moduleDir, folderName);
  
  if (!fs.existsSync(folderPath)) {
    console.log(`Skipping ${folderName} - not found`);
    return;
  }

  const files = fs.readdirSync(folderPath);
  const txtFile = files.find(f => f.endsWith('.txt'));
  
  if (!txtFile) {
    console.log(`Skipping ${folderName} - no .txt`);
    return;
  }

  const textPath = path.join(folderPath, txtFile);
  let text = fs.readFileSync(textPath, 'utf-8').trim();
  
  modules.push({
    id: i,
    name: folderName.replace(/^Module \d+\.\s*/, ''),
    text: text,
    meditation_video: `module${i}-meditation.mp4`,
    explanation_video: i === 1 ? null : `module${i}-explanation.mp4`
  });
  
  console.log(`Module ${i}: ${text.length} chars`);
});

fs.writeFileSync('modules.json', JSON.stringify(modules, null, 2));
console.log(`\nWrote ${modules.length} modules`);
