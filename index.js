#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

program
  .version('1.0.0')
  .description('Generate a React app with custom options');

program.parse(process.argv);
const repoUrl = 'https://github.com/gnest-org/gnest';

if (!repoUrl) {
  console.error('TEMPLATE_URL environment variable is not set.');
  process.exit(1);
}

const questions = [
  {
    type: 'input',
    name: 'projectName',
    message: 'Enter the name of your project:',
    default: 'my-genest-app',
  },
  {
    type: 'list',
    name: 'language',
    message: 'Choose the language:',
    choices: ['TypeScript'],
  },
  {
    type: 'checkbox',
    name: 'dependencies',
    message: 'Select additional dependencies:',
    choices: ['@nestjs/config', '@nestjs/typeorm', '@nestjs/swagger', 'class-validator', 'passport'],
  },
];

const runPrompt = async () => {
  try {
    const answers = await inquirer.prompt(questions);
    const { projectName, language, dependencies } = answers;
    const projectPath = path.join(process.cwd(), projectName);

    // Clone the project
    console.log(`Cloning template from ${repoUrl}...`);
    execSync(`git clone ${repoUrl} ${projectPath}`, { stdio: 'inherit' });

    // Remove the .git folder
    const gitFolderPath = path.join(projectPath, '.git');
    if (fs.existsSync(gitFolderPath)) {
      console.log('Removing .git folder...');
      await fs.remove(gitFolderPath);
    }

    // Modify package.json (optional) and install dependencies
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      packageJson.version = "1.0.0";
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });  
    }

    // Install project dependencies
    console.log('Installing project dependencies...');
    execSync(`pnpm install`, { cwd: projectPath, stdio: 'inherit' });

    // Install additional dependencies if selected
    if (dependencies.length > 0) {
      console.log('Installing additional dependencies...');
      execSync(`pnpm install ${dependencies.join(' ')}`, {
        cwd: projectPath,
        stdio: 'inherit',
      });
    }

    console.log(`Your NestJS app '${projectName}' has been created successfully!`);
  } catch (error) {
    console.error('Error generating the NestJS project:', error);
  }
};

runPrompt();
