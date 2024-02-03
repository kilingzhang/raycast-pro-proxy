# Raycast Pro Proxy

This project is a Cloudflare worker that acts as a proxy for Raycast and integrates with OpenAI.

## Project Structure

- `src/index.js`: The main entry point of the application.
- `package.json`: Defines the project dependencies and scripts.
- `wrangler.toml`: Configuration file for the Cloudflare worker.
- `.gitignore`: Specifies the files and directories that Git should ignore.

## Setup

1. Clone the repository.
2. Run `npm install` to install the dependencies.
3. Set up your environment variables in the `wrangler.toml` file.

## Development

To start the development server, run `npm run dev`.

## Deployment

To deploy the application, run `npm run deploy`.

## Dependencies

- `wrangler`: The CLI tool for Cloudflare Workers.
- `cloudflare-worker-request-data`: A utility for working with request data in Cloudflare Workers.
- `openai`: The official OpenAI API client.
- `reflare`: A library for building reactive web applications.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
