const fs = require('fs');
const path = require('path');

const emailFile = path.join(__dirname, 'scraper-agent/src/services/email.ts');
const logoFile = path.join(__dirname, 'web/public/Siteo-logo.png');

console.log('Reading email file:', emailFile);
let emailContent = fs.readFileSync(emailFile, 'utf8');

console.log('Reading logo file:', logoFile);
const logoBuffer = fs.readFileSync(logoFile);
const base64Logo = logoBuffer.toString('base64');
const dataUri = `data:image/png;base64,${base64Logo}`;

// Target the string we introduced in the previous step
const targetString = "${process.env.CLIENT_URL || 'https://siteo.io'}/Siteo-logo.png";

if (emailContent.includes(targetString)) {
    console.log('Found target string. Replacing with base64 data URI...');
    // Use replace to swap the URL with the data URI
    const newContent = emailContent.replace(targetString, dataUri);
    fs.writeFileSync(emailFile, newContent, 'utf8');
    console.log('Successfully updated email.ts with base64 logo.');
} else {
    console.error('Target string not found in email.ts! Content sample:', emailContent.substring(emailContent.indexOf('<img src='), emailContent.indexOf('<img src=') + 100));
}
