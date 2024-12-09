import inquirer from 'inquirer'
import fs from 'fs'
const industries = [
  'REAL_ESTATE',
  'HEALTHCARE',
  'EDUCATION',
  'PRM',
  'MANUFACTURING'
];

async function promptIndustry() {
  try {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'industry',
        message: 'Select an industry:',
        choices: industries,
        pageSize: 10 // Adjust this number to control how many options are visible at once
      }
    ]);

    let envContent = '';
    try {
      envContent = fs.readFileSync('.env', 'utf8');
    } catch (err) {
      // File doesn't exist yet, that's ok
    }

    const envLines = envContent.split('\n').filter(line => line.trim());
    const industryLineIndex = envLines.findIndex(line => line.startsWith('INDUSTRY='));
    const newIndustryLine = `INDUSTRY=${answer.industry}`;

    if (industryLineIndex >= 0) {
      envLines[industryLineIndex] = newIndustryLine;
    } else {
      envLines.push(newIndustryLine);
    }

    fs.writeFileSync('.env', envLines.join('\n') + '\n');
    console.log(`\nIndustry set to: ${answer.industry}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

promptIndustry();
