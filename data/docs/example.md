# Example Product Documentation

This is a sample documentation file used to demonstrate the RAG chatbot.
Replace these files with your own markdown or text documentation.

## Installation

To install the product, download the latest release from the website and
run the installer. The installer supports Windows, macOS, and Linux.

## Configuration

Configuration is stored in `~/.example/config.yaml`. The most common
settings are:

- `api_key`: your personal API token.
- `timeout`: request timeout in seconds (default: 30).
- `cache_dir`: where downloaded artifacts are cached.

## Authentication

The product authenticates with bearer tokens. Generate a token in the
dashboard under Settings → API Keys. Tokens never expire automatically
but can be revoked at any time.

## Troubleshooting

If the product fails to start, check the log file at
`~/.example/logs/app.log`. The most common cause is a missing API key.
