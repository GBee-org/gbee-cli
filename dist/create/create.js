#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrompt = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const child_process_1 = require("child_process");
const TEMPLATE_URL_TS = 'https://github.com/GBee-org/gbee'; // Update with your TS template repo
const questions = [
    {
        type: 'input',
        name: 'projectName',
        message: 'Enter the name of your project:',
        default: 'my-express-app',
    },
    {
        type: 'list',
        name: 'packageManager',
        message: 'Choose your package manager:',
        choices: ['npm', 'pnpm', 'yarn'],
    },
];
const replaceInFiles = async (directory, find, replace) => {
    const files = await fs_extra_1.default.readdir(directory);
    for (const file of files) {
        const filePath = path_1.default.join(directory, file);
        if ((await fs_extra_1.default.stat(filePath)).isDirectory()) {
            // Recursive call for directories
            await replaceInFiles(filePath, find, replace);
        }
        else {
            // Read and replace in files
            const content = await fs_extra_1.default.readFile(filePath, 'utf8');
            const updatedContent = content.replace(new RegExp(find, 'g'), replace);
            await fs_extra_1.default.writeFile(filePath, updatedContent, 'utf8');
        }
        // Rename files or directories if necessary
        if (file.includes(find)) {
            const newFilePath = path_1.default.join(directory, file.replace(find, replace));
            await fs_extra_1.default.rename(filePath, newFilePath);
        }
    }
};
const createPrompt = async () => {
    try {
        const answers = await inquirer_1.default.prompt(questions);
        const { projectName, packageManager } = answers;
        const projectPath = path_1.default.join(process.cwd(), projectName);
        const repoUrl = TEMPLATE_URL_TS;
        // Clone the project
        console.log(`Cloning template from ${repoUrl}...`);
        (0, child_process_1.execSync)(`git clone ${repoUrl} ${projectPath}`, { stdio: 'inherit' });
        // Remove the .git folder
        const gitFolderPath = path_1.default.join(projectPath, '.git');
        if (fs_extra_1.default.existsSync(gitFolderPath)) {
            console.log('Removing .git folder...');
            await fs_extra_1.default.remove(gitFolderPath);
        }
        // Update package.json (optional)
        const packageJsonPath = path_1.default.join(projectPath, 'package.json');
        if (fs_extra_1.default.existsSync(packageJsonPath)) {
            const packageJson = await fs_extra_1.default.readJson(packageJsonPath);
            packageJson.name = projectName;
            packageJson.version = "1.0.0";
            await fs_extra_1.default.writeJson(packageJsonPath, packageJson, { spaces: 2 });
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
        const appPath = path_1.default.join(projectPath, 'app');
        if (!fs_extra_1.default.existsSync(appPath)) {
            console.error('Error: The "app" folder does not exist in the project.');
            process.exit(1);
        }
        // Installer les dépendances dans le dossier "app"
        console.log('Installing base dependencies...');
        (0, child_process_1.execSync)(`${packageManager} install`, { cwd: appPath, stdio: 'inherit' });
        console.log(`Your BackEndExpress App '${projectName}' has been created successfully!`);
        console.log('Next steps:');
        console.log(`  cd ${projectName}/app`);
        console.log(`  ${packageManager} install`);
        console.log(`  ${packageManager} start`);
    }
    catch (error) {
        console.error('Error creating the project:', error.message);
    }
};
exports.createPrompt = createPrompt;
