#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { execSync } from 'child_process';

const TEMPLATE_URL_JS = 'https://github.com/GBee-org/gbee'; // Update with your JS template repo
const TEMPLATE_URL_TS = 'https://github.com/GBee-org/gbee'; // Update with your TS template repo

const questions = [
  {
    type: 'input',  
    name: 'projectName',
    message: 'Enter the name of your project:',
    default: 'my-express-app',
  },
  {
    // type: 'list',
    // name: 'language',
    // message: 'Choose the language:',
    // choices: ['JavaScript', 'TypeScript'],
  },
  {
    type: 'list',
    name: 'packageManager',
    message: 'Choose your package manager:',
    choices: ['npm', 'pnpm', 'yarn'],
  },
  // {
  //   type: 'checkbox',
  //   name: 'dependencies',
  //   message: 'Select additional dependencies:',
  //   choices: ['express-session', 'express-validator', 'passport'],
  // },
];


const replaceInFiles = async (directory, find, replace) => {
  const files = await fs.readdir(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);

    if ((await fs.stat(filePath)).isDirectory()) {
      // Recursive call for directories
      await replaceInFiles(filePath, find, replace);
    } else {
      // Read and replace in files
      const content = await fs.readFile(filePath, 'utf8');
      const updatedContent = content.replace(new RegExp(find, 'g'), replace);
      await fs.writeFile(filePath, updatedContent, 'utf8');
    }

    // Rename files or directories if necessary
    if (file.includes(find)) {
      const newFilePath = path.join(directory, file.replace(find, replace));
      await fs.rename(filePath, newFilePath);
    }
  }
};

const createPrompt = async () => {
  try {
    const answers = await inquirer.prompt(questions);
    const { projectName, language, packageManager, dependencies } = answers;
    const projectPath = path.join(process.cwd(), projectName);

    // Select the appropriate template URL
    // const repoUrl = language === 'TypeScript' ? TEMPLATE_URL_TS : TEMPLATE_URL_JS;
    const repoUrl = TEMPLATE_URL_TS;

    if (!repoUrl) {
      console.error('Template URL is not defined for the selected language.');
      process.exit(1);
    }

    // Clone the project
    console.log(`Cloning template from ${repoUrl}...`);
    execSync(`git clone ${repoUrl} ${projectPath}`, { stdio: 'inherit' });

    // Remove the .git folder
    const gitFolderPath = path.join(projectPath, '.git');
    if (fs.existsSync(gitFolderPath)) {
      console.log('Removing .git folder...');
      await fs.remove(gitFolderPath);
    }

    // Update package.json (optional)
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      packageJson.version = "1.0.0";
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    // Replace occurrences of "gbee-app" or "GBeeApp" with the project name
    console.log('Customizing project with your project name...');
    const find = 'gbee-app'; // Nom générique à remplacer
    const replace = projectName.toLowerCase();
    await replaceInFiles(projectPath, find, replace);

    const findRestCamelCase = 'GBeeRest'; // CamelCase pour les noms de classes ou variables
    const replaceRestCamelCase = projectName.replace(/-./g, (x) => x[1].toUpperCase());
    await replaceInFiles(projectPath, findRestCamelCase, replaceRestCamelCase);

    const findCamelCase = 'GBeeApp'; // CamelCase pour les noms de classes ou variables
    const replaceCamelCase = projectName.replace(/-./g, (x) => x[1].toUpperCase());
    await replaceInFiles(projectPath, findCamelCase, replaceCamelCase);

    // Verify if app folder exists
    const appPath = path.join(projectPath, 'app');
    if (!fs.existsSync(appPath)) {
      console.error('Error: The "app" folder does not exist in the project.');
      process.exit(1);
    }
    
    // Installer les dépendances dans le dossier "app"
    console.log('Installing base dependencies...');
    execSync(`${packageManager} install`, { cwd: appPath, stdio: 'inherit' });

    if (dependencies.length > 0 || dependencies !== undefined || dependencies !== null) {
      console.log('Installing additional dependencies...');
      execSync(`${packageManager} install ${dependencies.join(' ')}`, { cwd: appPath, stdio: 'inherit' });
    }

    console.log(`Your BackEndExpress App '${projectName}' has been created successfully!`);
    console.log('Next steps:');
    console.log(`  cd ${projectName}/app`);
    console.log(`  ${packageManager} install`);
    console.log(`  ${packageManager} start`);

  } catch (error) {
    console.error('Error creating the project:', error.message);
  }
};

export default createPrompt;