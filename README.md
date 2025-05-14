# gem: A CLI Based Assistent to help in Development and learning

![Status Badge](https://img.shields.io/badge/status-in%20development-yellow)

A command-line assistant powered by Google Gemini, designed to streamline your tasks directly from the terminal.

## Features

* **Powered by Google Gemini:** Leverages the power of Google's AI models for a wide range of tasks.
* **CLI-Based:** Access AI assistance directly from your terminal, without needing a GUI.

## Getting Started

### Prerequisites

* Node.js (version 23 or higher recommended)
* Bun (package manager - highly recommended)
* A Google Cloud project with the Gemini API enabled.
* A Google Cloud API key or service account credentials.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/57Ajay/gem.git
   cd gem
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```
   ```bash
   bun run build
   ```

3. **Configure environment variables:**
   * Create a `.env` file in the project root directory.
   * Add your Google Cloud API key or service account credentials:
     ```
     GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
     ```
     **Important:** You can set your API key  with `gem configure` command as then paste the API key and also choose your default model.`.

### Usage

```
gem [command]
Chat with Gemini about the current directory or a specific path
Commands:
  gem analyse <fileName>               Analyze a file and start an interactive chat about it
  gem fix <fileName>                   Attempt to fix code in a file and save to <fileName-fixedByGemini>
  gem models                           List available/configured Gemini models
  gem use model <modelName>            Set the Gemini model to use for the current session
  gem configure                        Configure Gem settings (API key, default model)
  gem chat [path]                      Chat with Gemini about the current directory or a specific path                            [default]
Positionals:
  path  Optional path to a file or directory to discuss                                                                                     [string]
Options:
  -v, --version  Show version number (gem -v)                                                                                              [boolean]
  -h, --help     Show help (gem -h)                                                                                                        [boolean]
```

Example usage:

```bash
gem chat ./                      # Chat about current directory
gem analyse app.js             # Analyze a specific file
gem fix broken-script.js       # Fix code in a file
gem use model gemini-pro-1.5   # Switch to a specific model
```

## Configuration

The following environment variables can be configured in the `.env` file:

* `GOOGLE_API_KEY`: (Required) Your Google Cloud API key for accessing the Gemini API.
* `DEFAULT_MODEL`: (Optional) Set your preferred Gemini model as default.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Submit a pull request.

## License

MIT License

Copyright (c) 2025 Ajay Upadhyay

## Acknowledgements

* Powered by Google Gemini.
* Built with Node.js and Bun.

For more information or to report issues, visit: [github.com/57ajay/gem](https://github.com/57ajay/gem)
