#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import createPrompt from './create.js';

const { readFileSync }  = fs;
const program = new Command();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

program
  .version(pkg.version)
  .description('Generate an BackEndExpress app with custom options');


program
  .command('create')
  .description('Create a new generate backend express app')
  .action(() => {
    createPrompt();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
