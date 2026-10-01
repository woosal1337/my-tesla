# Contributing

Thank you for your help. This guide covers bug reports, ideas, and code changes.

## Report a bug

1. Search the open issues first.
2. Open a new issue with the "Bug report" form.
3. Give the dashboard version, the TeslaMate version, the browser, and the steps to see the problem.
4. Remove locations, addresses, VINs, and email addresses from logs and screenshots.

Report a security problem privately. Read [SECURITY.md](SECURITY.md).

## Suggest a feature

Open an issue with the "Feature request" form. Describe the problem first, then the change that you want. A new page or chart needs the TeslaMate table and columns that hold its data.

## Change the code

1. Read [the development guide](docs/development.md) and set up the tools.
2. Open an issue first for a large change, so that we agree on the design before you write it.
3. Make the smallest change that solves the problem.
4. Add or update the tests next to the module that you change, with the `.test.ts` suffix.
5. Run the gates:

   ```bash
   python3 tools/quality.py check
   bun run build
   ```

6. Check the pages that you change on the [demo data](docs/demo-data.md), in light and dark, and at 390 px wide.
7. Open a pull request. Fill in the template.

## Code rules

- Use strict TypeScript types at module boundaries.
- Validate every environment value before use.
- Keep SQL in `postgres` tagged templates, never in string concatenation.
- Keep all database access in `src/lib/`, behind the `server-only` import. The app never writes to the TeslaMate database.
- Keep prose in docs. Do not add prose comments inside source or configuration files. [Quality gates](docs/quality.md) list the exceptions.
- Do not add a dependency without a concrete need.
- Do not reformat code that your change does not touch.

## Commits

- Write the title in the imperative mood, for example "Add the mileage chart".
- Keep each commit focused on one change.
- The pre-commit hook runs the gates, and the pre-push hook runs the tests. Install them with `python3 tools/quality.py hooks-install`.

## Documentation

Write docs in short, plain sentences: active voice, one instruction for each sentence, and the same word for the same thing. Record a lasting design choice as a new file in `docs/decisions/`.

## License

You agree that your contribution is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE).

## Conduct

Read the [code of conduct](CODE_OF_CONDUCT.md).
