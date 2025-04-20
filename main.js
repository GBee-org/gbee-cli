#!/usr/bin/env node

import fs from 'fs-extra';
import { Command } from 'commander';
import createPrompt from './create.js';
import generatePrompt from './generate.js';

const program = new Command();

let pkg = {};
try {
  const pkgPath = new URL('./package.json', import.meta.url);
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (error) {
  console.error('Error reading package.json:', error.message);
  process.exit(1);
}

program
  .version(pkg.version)
  .description('Generate an BackEndExpress app with custom options');

program
  .command('create')
  .description('Create a new backend express app')
  .action(() => {
    createPrompt();
  });

program
  .command('generate')
  .description('Generate app endpoint from api.yml file')
  .argument('<api>')
  .action((api) => {
    generatePrompt({api});
  });

program.on('command:*', ([cmd]) => {
  console.error(`Error: Unknown command '${cmd}'`);
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
