# Readme

> 🚧 **Early work in progress.**

Lazy load fonts, with JSON Built around how [Fountain](https://fountain.nymarktype.co) will use it together with [font-tester](https://github.com/andreasnymark/font-tester), without any dependencies.

## What it does

- Preloads `[data-font-load=“eager”]` and lazy loads `[data-font-load=“lazy”]`
- `data-requires-all-weights=“true”` loads all fonts from custom element `<font-style>` on focus/click. *I’m making a config for this*
- Adds `.fonts-loaded` and `.font-loaded`. *I’m making a config for this*


## Usage

### Eager

```html
<div class="preview" data-font-load="eager" data-font-family="spacegrotesk-bold">
	…
</div>
```

### Lazy

```html
<div class="preview" data-font-load="lazy" data-font-family="spacegrotesk-bold">
	…
</div>
```

### Font metadata

```html
<script id="font-metadata" type="application/json">
	{
		"spacegrotesk-bold": {
			"name":"Space Grotesk Bold",
			"family":"spacegroteskbold",
			"weightValue":"700",
			"weightName":"Bold",
			"style":"normal",
			"url":"https://…/space-grotesk-bold.woff2"
		}
	}
</script>
```
## Roadmap

- [ ] Better docs
- [ ] Config
- [ ] Loosen the tight integration with [font-tester](https://github.com/andreasnymark/font-tester)

## Why?

A simple way lazy load fonts. Intended for [Fountain](https://fountain.nymarktype.co), a type foundry e-commerce platform. But it’ll work anywhere. 


## License

MIT

---

*This is very much a work in progress. Things will change.*