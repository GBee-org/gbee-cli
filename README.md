# gbee-cli 🐝

[![npm version](https://badge.fury.io/js/gbee-cli.svg)](https://www.npmjs.com/package/gbee-cli)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

`gbee-cli` is a command line application (CLI) designed to quickly generate BackEnd Express projects with customized options.

---

## 🚀 Features

- Easily create template-based BackEnd Express projects.
- Manage custom options via interactive prompts.
- Integrated with Git to clone project templates.
- Compatible with Node.js (modern versions).

---

## 📦 Installation

Install the application via [npm](https://www.npmjs.com/):

```bash
npm install -g gbee-cli
# or
pnpm install -g gbee-cli
```


## 🛠️ Usage

After installing `gbee-cli`, you can start generating your backend project using the following commands:

### 📁 Create a New Project

```bash
gbee create
```

This command initializes a new Express-based backend project using an interactive template setup. It walks you through configuration steps such as project name, database integration, structure setup, and more.


## 🔧 Generate Backend from API Specification

```bash
gbee generate <spec-file>.yml
```
This command automatically generates the backend structure (routes, controllers, services, etc.) from an OpenAPI-compatible api.yml file.

|  ⚠️ Make sure the api.yml file is located at the root of your project before running this command.

Example of spec file: [api.yaml](/api.yml)