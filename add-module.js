#!/usr/bin/env node

import { execSync } from 'child_process';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';

const questions = [
  {
    type: 'input',
    name: 'projectName',
    message: 'Enter the name of the project to modify:',
  },
  {
    type: 'input',
    name: 'moduleName',
    message: 'Enter the module name to create:',
    default: 'example',
  },
];

const runPrompt = async () => {
  try {
    const answers = await inquirer.prompt(questions);
    const { projectName, moduleName } = answers;
    const projectPath = path.join(process.cwd(), projectName);

    // Vérifier si le projet existe
    if (!fs.existsSync(projectPath)) {
      console.error(`The project directory '${projectPath}' does not exist.`);
      process.exit(1);
    }

    // Créer module, contrôleur et service
    console.log(`Navigating to project directory ${projectPath}...`);
    
    console.log(`Creating module '${moduleName}'...`);
    execSync(`pnpm nest g module ${moduleName}`, { cwd: projectPath, stdio: 'inherit' });
    
    console.log(`Creating controller '${moduleName}'...`);
    execSync(`pnpm nest g controller ${moduleName}`, { cwd: projectPath, stdio: 'inherit' });
    
    console.log(`Creating service '${moduleName}'...`);
    execSync(`pnpm nest g service ${moduleName}`, { cwd: projectPath, stdio: 'inherit' });

    console.log(`Module '${moduleName}', controller '${moduleName}' and service '${moduleName}' have been created successfully in '${projectName}'!`);
  } catch (error) {
    console.error('Error adding components to the NestJS project:', error);
  }
};

runPrompt();
