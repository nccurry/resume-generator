# Nick's Resume Generator

Generate a decent looking resume with NodeJS, Puppeteer, and Pug.

![](exampleResume.png?raw=true)

## Generate a resume

### Install packages

Install NodeJS on your system and install the required npm packages.

```shell
# Fedora 40
sudo dnf module enable nodejs:22
sudo dnf install module nodejs:22/common
npm install

# Ubuntu 22.04
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
node -v
nvm current
npm -v

# Windows 11
winget install OpenJS.NodeJS
npm install
```

### Fill out resume data

Add your information to a YAML file.

```shell
cp exampleData.yaml myResume.yaml
vi myResume.yaml
```

### Generate resume

Generate the HTML and optional PDF file using Pug and Puppeteer. 

HTML and PDF files are output to the [dist](dist) directory.

```shell
npm install
npx ts-node src/index.ts --file myResume.yaml --template "green-columns"
```