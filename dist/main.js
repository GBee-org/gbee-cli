#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const commander_1 = require("commander");
const create_1 = require("./create");
const generate_1 = require("./generate");
const program = new commander_1.Command();
let pkg = {};
try {
    const pkgPath = __dirname + "/../package.json";
    pkg = JSON.parse(fs_extra_1.default.readFileSync(pkgPath, "utf8"));
}
catch (error) {
    console.error("Error reading package.json:", error.message);
    process.exit(1);
}
program
    .version(pkg.version)
    .description("Generate an BackEndExpress app with custom options");
program
    .command("create")
    .description("Create a new backend express app")
    .action(() => {
    (0, create_1.createPrompt)();
});
program
    .command("generate")
    .description("Generate app endpoint from api.yml file")
    .argument("<api>")
    .action((api) => {
    (0, generate_1.generatePrompt)({ api });
});
program.on("command:*", ([cmd]) => {
    console.error(`Error: Unknown command '${cmd}'`);
    program.outputHelp();
    process.exit(1);
});
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
