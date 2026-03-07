# font-loader

Lazy load fonts using the FontFace API and IntersectionObserver, without any dependencies.

## How it works

Fonts are registered on demand via the [FontFace API](https://developer.mozilla.org/en-US/docs/Web/API/FontFace) — no CSS `@font-face` declarations needed. Font URLs and metadata are provided via a JSON script element in the page.

- **Eager** elements load their font immediately on init
- **Lazy** elements load their font when scrolled into view via IntersectionObserver
- Classes are added after the font loads so CSS can react to them

For eager fonts, pair with `<link rel="preload">` so the browser fetches the file before the script runs:

```html
<link rel="preload" href="…/font.woff2" as="font" type="font/woff2" crossorigin>
```

## Usage

```html
<script src="font-loader.js" type="module"></script>
```

### Eager

Loads the font immediately. Use for fonts visible on page load.

```html
<div data-font-load="eager" data-font-family="spacegrotesk-bold">
	…
</div>
```

### Lazy

Loads the font when the element scrolls into view (with a configurable root margin, default `300px`).

```html
<div data-font-load="lazy" data-font-family="spacegrotesk-bold">
	…
</div>
```

The class `font-loaded` is added to the element once the font is ready.

## Font metadata

Font data is provided via a JSON script element. Each key corresponds to the value used in `data-font-family`.

```html
<script id="font-metadata" type="application/json">
	{
		"spacegrotesk-bold": {
			"name": "Space Grotesk Bold",
			"family": "spacegroteskbold",
			"weight": "700",
			"style": "normal",
			"url": "https://…/space-grotesk-bold.woff2"
		}
	}
</script>
```

| Field | Description |
|-------|-------------|
| `name` | Human-readable font name |
| `family` | Font family name registered with the FontFace API |
| `weight` | Weight value (`100`–`900`). Defaults to `normal` if omitted |
| `style` | `normal` or `italic`. Defaults to `normal` if omitted |
| `stretch` | Width value (e.g. `75%`). Defaults to `normal` if omitted |
| `url` | URL to the `.woff2` file |

### Variable fonts

For variable fonts, `weight`, `style`, and `stretch` accept range values. The browser uses these to match the font when CSS requests a value within the range.

```html
<script id="font-metadata" type="application/json">
	{
		"myfont-variable": {
			"name": "My Variable Font",
			"family": "myfont",
			"weight": "100 900",
			"style": "normal",
			"stretch": "75% 125%",
			"url": "https://…/myfont-variable.woff2"
		}
	}
</script>
```

Custom axis values (`font-variation-settings`) are applied via CSS on the elements — they are outside the scope of the loader.

## Configuration

Override defaults via a global `window.FontLoaderConfig` object, set before loading the script:

```html
<script>
    window.FontLoaderConfig = {
        rootMargin: '500px',
        fontsLoadedClass: 'my-fonts-loaded'
    };
</script>
<script src="font-loader.js" type="module"></script>
```

| Key | Default | Description |
|-----|---------|-------------|
| `eagerSelector` | `[data-font-load="eager"]` | Elements to load immediately |
| `lazySelector` | `[data-font-load="lazy"]` | Elements to lazy load |
| `fontsLoadedClass` | `fonts-loaded` | Class added when all fonts are loaded |
| `fontLoadedClass` | `font-loaded` | Class added to a lazy element on load |
| `rootMargin` | `300px` | IntersectionObserver root margin |
| `threshold` | `0` | IntersectionObserver threshold |
| `metadataSelector` | `#font-metadata` | Selector for the JSON metadata script element |

## font-tester integration

`font-loader` exports `loadFont` and `config` for use by other scripts. The [font-tester](https://github.com/andreasnymark/font-tester) integration is handled separately in that repo and imports `font-loader` as a bare specifier via an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap).

Add the import map to your `<head>` **before** any `<script type="module">` tags:

```html
<script type="importmap">
{
    "imports": {
        "font-loader": "https://…/font-loader.js"
    }
}
</script>
```

Note: if your page uses a Content Security Policy with nonces, the import map tag also needs the `nonce` attribute.

## Why?

A simple way to lazy load fonts. Intended for [Fountain](https://fountain.nymarktype.co), a type foundry e-commerce platform. But it'll work anywhere.

## License

MIT
