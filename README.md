# Nick's Resume Generator

Generate a decent looking resume with NodeJS, Puppeteer, and Pug.

![](exampleResume.png?raw=true)

## Generate a resume

### Install packages

Install NodeJS on your system and install the required npm packages.

```shell
# Fedora
sudo dnf module enable nodejs:16
sudo dnf install module nodejs:16/default
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
# npx ts-node src/index.ts </path/to/data.yaml> <generate pdf true / false>
npx ts-node src/index.ts myResume.yaml true
```