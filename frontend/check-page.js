const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');
const line = lines.find(l => l.includes('const XLM_TOKEN_ID ='));

if (line) {
    const parts = line.split('"');
    if (parts.length >= 2) {
        const id = parts[1];
        console.log('ID:', id);
        console.log('Length:', id.length);
        if (id.length !== 56) {
            console.error('ERROR: Length is not 56!');
            process.exit(1);
        }
        console.log('Length is correct.');
    } else {
        console.log('Could not parse ID from line:', line);
    }
} else {
    console.log('Could not find XLM_TOKEN_ID line');
}
