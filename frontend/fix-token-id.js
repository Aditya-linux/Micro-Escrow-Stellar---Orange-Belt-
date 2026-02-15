// This script fetches the native XLM contract ID from soroban CLI,
// then patches page.tsx with the clean ID.
const { execSync } = require('child_process');
const fs = require('fs');

// Get the native XLM contract ID from soroban CLI
const rawId = execSync('soroban contract id asset --asset native --network testnet', { encoding: 'utf8' });
const cleanId = rawId.replace(/[^A-Z0-9]/g, ''); // strip ALL non-alphanumeric chars

console.log('Clean ID:', cleanId);
console.log('Length:', cleanId.length);

if (cleanId.length !== 56) {
    console.error('ERROR: ID length is not 56, got', cleanId.length);
    process.exit(1);
}

// Read page.tsx
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace the XLM_TOKEN_ID line
const regex = /const XLM_TOKEN_ID = ".*?";/;
const replacement = `const XLM_TOKEN_ID = "${cleanId}";`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/app/page.tsx', content, 'utf8');
    console.log('SUCCESS: page.tsx updated with clean ID');
} else {
    console.error('ERROR: Could not find XLM_TOKEN_ID line in page.tsx');
    process.exit(1);
}

// Verify: read back and check
const verifyContent = fs.readFileSync('src/app/page.tsx', 'utf8');
const verifyMatch = verifyContent.match(/const XLM_TOKEN_ID = "([^"]+)"/);
if (verifyMatch) {
    const verifiedId = verifyMatch[1];
    console.log('Verified ID:', verifiedId);
    console.log('Verified Length:', verifiedId.length);
    console.log('IDs match:', verifiedId === cleanId);
} else {
    console.error('ERROR: Could not verify');
}
