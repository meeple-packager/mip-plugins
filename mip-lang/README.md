
# mip-lang - custom languages for MIP

Create, pack, and apply custom language packs for MIP.

---

## Commands

### `mip pe mip-lang create <name> <template>`

Creates a new language from an existing template.

```bash
mip pe mip-lang create pirate en
```

This creates `plugins/mip-lang/locales/pirate.json` based on `templates/en.json`.

---

### Modify translations

Edit the generated JSON file:

```bash
vim plugins/mip-lang/locales/pirate.json
```

Change any value. For example:

```json
{
  "cli.version": "mip v{{version}} - arrr!",
  "commands.install.installing": "Arrr! Installin' {package}..."
}
```

---

### `mip pe mip-lang pack <name>`

Packages a custom language into a standalone plugin.

```bash
mip pe mip-lang pack pirate
```

Creates `plugins/mip-lang-pirate/` with all necessary files.

---

### Compile & activate

```bash
mip plugin compile mip-lang-pirate
mip plugin activate mip-lang-pirate
```

---

### `mip language <name>`

Applies the language to your project.

```bash
mip language pirate
```

Or use the apply command:

```bash
mip pe mip-lang apply pirate
```

---

### `mip pe mip-lang reset`

Resets to English.

```bash
mip pe mip-lang reset
```

---

### `mip pe mip-lang list`

Shows all available languages (built-in + custom).

```bash
mip pe mip-lang list
```

---

## Example

```bash
# 1. Create pirate language
mip pe mip-lang create pirate en

# 2. Edit translations
vim plugins/mip-lang/locales/pirate.json

# 3. Pack into plugin
mip pe mip-lang pack pirate

# 4. Compile and activate
mip plugin compile mip-lang-pirate
mip plugin activate mip-lang-pirate

# 5. Apply
mip language pirate

# 6. Check
mip --version
# mip v2.0 - arrr!
```

---

## Available templates

- `en` - English
- `ru` - Russian
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean

---

## Structure

```
plugins/mip-lang/
├── index.js
├── package.json
├── templates/
│   ├── en.json
│   ├── ru.json
│   └── ...
└── locales/
    └── pirate.json   # your custom language
```

---

## License

MIT
