/**
 * Coldwell Banker Test Script
 * 
 * Usage:
 *   npm run test:cb -- --url "https://www.coldwellbanker.com/Coldwell-Banker-Realty-5678c/..."
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

dotenv.config();

import { extractCBProfile } from './extractors/coldwellbanker';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('url', {
            alias: 'u',
            type: 'string',
            description: 'Coldwell Banker agent profile URL',
            demandOption: true
        })
        .help()
        .parse();

    console.log(chalk.bold.blue('\n═══════════════════════════════════════════════════════════'));
    console.log(chalk.bold.blue('  Coldwell Banker Profile Extractor - Test'));
    console.log(chalk.bold.blue('═══════════════════════════════════════════════════════════\n'));

    const profile = await extractCBProfile(argv.url);

    // Save result
    const outputDir = path.join(__dirname, '..', 'output', 'debug');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'cb_test_result.json');
    fs.writeFileSync(outputPath, JSON.stringify(profile, null, 2));

    console.log(chalk.bold.green('\n═══════════════════════════════════════════════════════════'));
    console.log(chalk.bold.green('  Extraction Results'));
    console.log(chalk.bold.green('═══════════════════════════════════════════════════════════\n'));

    if (profile.extraction_success) {
        console.log(chalk.green('✓ Extraction successful!\n'));
    } else {
        console.log(chalk.yellow('⚠ Partial extraction\n'));
    }

    console.log(chalk.white(`  Name:       ${profile.full_name || chalk.gray('Not found')}`));
    console.log(chalk.white(`  Email:      ${profile.email || chalk.gray('Not found')}`));
    console.log(chalk.white(`  Mobile:     ${profile.mobile_phone || chalk.gray('Not found')}`));
    console.log(chalk.white(`  Office:     ${profile.office_phone || chalk.gray('Not found')}`));
    console.log(chalk.white(`  All Phones: ${profile.all_phones.length > 0 ? profile.all_phones.join(', ') : chalk.gray('None')}`));
    console.log(chalk.white(`  Headshot:   ${profile.headshot_url ? chalk.green('Found') : chalk.gray('Not found')}`));
    console.log(chalk.white(`  Logo:       ${profile.logo_url ? chalk.green('Found') : chalk.gray('Not found')}`));
    console.log(chalk.white(`  Bio:        ${profile.bio ? chalk.green('Found (' + profile.bio.length + ' chars)') : chalk.gray('Not found')}`));

    // Social links
    console.log(chalk.bold('\n  Social Media:'));
    console.log(chalk.white(`    LinkedIn:  ${profile.social_links.linkedin || chalk.gray('Not found')}`));
    console.log(chalk.white(`    Facebook:  ${profile.social_links.facebook || chalk.gray('Not found')}`));
    console.log(chalk.white(`    Instagram: ${profile.social_links.instagram || chalk.gray('Not found')}`));
    console.log(chalk.white(`    Twitter:   ${profile.social_links.twitter || chalk.gray('Not found')}`));
    console.log(chalk.white(`    YouTube:   ${profile.social_links.youtube || chalk.gray('Not found')}`));

    if (profile.extraction_errors.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        for (const err of profile.extraction_errors) {
            console.log(chalk.yellow(`  - ${err}`));
        }
    }

    console.log(chalk.gray(`\nFull result saved to: ${outputPath}`));
    console.log(chalk.bold.green('\n✓ Done\n'));
}

main().catch(err => {
    console.error(chalk.red('Error:'), err);
    process.exit(1);
});
