# Nick's Resume Generator

Generate an HTML and PDF resume with Node.js, Puppeteer, and Pug.

![Example resume](exampleResume.png?raw=true)

## Set up the repository

The bootstrap scripts install pinned copies of mise, Task, Node.js, and all npm and
Puppeteer dependencies inside this repository. They do not require administrator
access or modify your shell profile.

On Linux or macOS:

```shell
./bootstrap.sh
```

On Windows PowerShell:

```powershell
.\bootstrap.ps1
```

Bootstrap is safe to run again. To provision the tools and run a specific task,
pass the task name and its arguments:

```shell
./bootstrap.sh check
./bootstrap.sh generate -- --file exampleData.yaml --no-pdf
```

```powershell
.\bootstrap.ps1 check
.\bootstrap.ps1 generate -- --file exampleData.yaml --no-pdf
```

## Generate a resume

Copy the example data and replace it with your information:

```shell
cp exampleData.yaml myResume.yaml
```

Then generate HTML and PDF output in `dist/`. Use the bootstrap wrapper so the
command always runs with the repository's pinned tools:

```shell
./bootstrap.sh generate -- --file myResume.yaml --template green-columns
```

```powershell
.\bootstrap.ps1 generate -- --file myResume.yaml --template green-columns
```

Available templates are `green-columns` and `man-page`. Add `--no-pdf` to skip
launching Chrome and generate only HTML.

## Common tasks

Pass a Task command to the bootstrap script, such as `./bootstrap.sh check` or
`.\bootstrap.ps1 check`. If mise is already active in your shell, you can also run
the underlying `task` commands directly. Run `task` to list every command.

The main repository activities are:

| Command | Purpose |
| --- | --- |
| `task setup` | Install exact locked dependencies and show tool versions |
| `task check` | Run Biome, TypeScript, the production build, and template smoke tests |
| `task generate -- --file <yaml>` | Build and generate a resume |
| `task format` | Format source and configuration files |
| `task deps:outdated` | Report outdated direct npm dependencies |
| `task deps:update` | Update direct dependencies to stable latest versions and validate them |
| `task clean` | Remove generated output |

Pinned tool versions are declared in `mise.toml`; the bootstrapped mise release and
archive checksums are declared in `versions.env`.
