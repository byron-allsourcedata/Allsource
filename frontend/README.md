# Allsource

Follow the steps below to get started with setting up and running the project.

## Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (Recommended: the latest LTS version) This project use Node js version 21.7.3.

- [Biome plugin](https://biomejs.dev/guides/editors/first-party-extensions/) for auto-formatting and linting


## Installation

Clone the repository

```bash
git clone https://github.com/Filed-com/maximiz/
```

Set up git hooks

```bash
cp -r hooks .git/
```

Install the project dependencies:
```bash
npm run install
```

## Development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

```bash
npm run build
```

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.
