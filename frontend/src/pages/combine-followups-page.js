// Script to combine FollowUpsPage parts into a single file
const fs = require('fs').promises;
const path = require('path');

async function combineFiles() {
  try {
    const basePath = path.join(__dirname);
    
    // Read part 1
    const part1 = await fs.readFile(path.join(basePath, 'FollowUpsPage_part1.js'), 'utf-8');
    
    // Read part 2
    const part2 = await fs.readFile(path.join(basePath, 'FollowUpsPage_part2.js'), 'utf-8');
    
    // Combine both parts
    // Remove the trailing comment from part 1 and add part 2
    const combinedContent = part1.replace(/\/\/ Continue in part 2\.\.\./g, '') + part2;
    
    // Write the combined file
    await fs.writeFile(path.join(basePath, 'FollowUpsPage.js'), combinedContent);
    
    console.log('Successfully combined FollowUpsPage parts into FollowUpsPage.js');
  } catch (error) {
    console.error('Error combining files:', error);
  }
}

combineFiles();
