// Verify the ID in page.tsx works with the SDK
const fs = require('fs');
const sdk = require('@stellar/stellar-sdk');

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const match = content.match(/const XLM_TOKEN_ID = "([^"]+)"/);

if (!match) {
    console.error('Could not find XLM_TOKEN_ID in page.tsx');
    process.exit(1);
}

const id = match[1];
console.log('ID from page.tsx:', id);
console.log('Length:', id.length);

// Test StrKey
try {
    const bytes = sdk.StrKey.decodeContract(id);
    console.log('StrKey.decodeContract: SUCCESS (bytes:', bytes.length, ')');
} catch (e) {
    console.error('StrKey.decodeContract: FAILED -', e.message);
}

// Test Contract class
try {
    const contract = new sdk.Contract(id);
    console.log('Contract class: SUCCESS');
    const addr = contract.address();
    console.log('Contract.address(): SUCCESS');
    const scVal = addr.toScVal();
    console.log('address.toScVal(): SUCCESS');
} catch (e) {
    console.error('Contract/Address: FAILED -', e.message);
}
