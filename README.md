# Resume Generator

## Generate a resume

### Install packages
```shell
# Fedora
sudo dnf module enable nodejs:16
sudo dnf install module nodejs:16/default
npm install
```

### Fill out resume data

```shell
cp exampleData.yaml myResume.yaml
vi myResume.yaml
```

### Generate resume

Html and pdf files are output to the [dist](dist) directory.

```shell
# npx ts-node src/index.ts </path/to/data.yaml> <generate pdf true / false>
npx ts-node src/index.ts myResume.yaml true
```