( function() {
	'use strict';

	const config = {
		eagerSelector: '[data-font-load="eager"]',
		lazySelector: '[data-font-load="lazy"]',
		fontsLoadedClass: 'fonts-loaded',
		fontLoadedClass: 'font-loaded',
		rootMargin: '300px',
		threshold: 0,
		metadataSelector: '#font-metadata',
	};

	const metadataElement = document.querySelector( config.metadataSelector );
	if ( ! metadataElement ) {
		console.warn( 'font-metadata element not found, font loading disabled' );
		return;
	}

	let fontMetadata;
	try {
		fontMetadata = JSON.parse( metadataElement.textContent );
	} catch ( err ) {
		console.error( 'Failed to parse font metadata:', err );
		return;
	}

	const loadedFonts = new Set();
	const loadedFontTesters = new WeakSet();
	const fontLoadPromises = new Map();

	function loadFont( fontFamily ) {
		if ( loadedFonts.has( fontFamily )) {
			return fontLoadPromises.get( fontFamily ) || Promise.resolve();
		}

		const fontData = fontMetadata[ fontFamily ];
		if ( ! fontData ) {
			console.warn( 'Font not found:', fontFamily );
			return Promise.resolve();
		}

		const promise = new FontFace(
			fontData.family,
			`url(${fontData.url})`,
			{
				weight: fontData.weightValue,
				style: fontData.style || 'normal',
			}
		)
		.load()
		.then( loadedFace => {
			document.fonts.add( loadedFace );
			loadedFonts.add( fontFamily );
		})
		.catch( err => {
			console.error( 'Failed to load font:', fontData.name, err );
		});

		fontLoadPromises.set( fontFamily, promise );
		return promise;
	}

	function loadAllFontsForTester( fontTester ) {
		if ( loadedFontTesters.has( fontTester ) ) {
			return Promise.resolve();
		}

		const fontStyles = fontTester.querySelectorAll( 'font-style' );
		const families = Array.from( fontStyles )
			.map( el => el.getAttribute( 'family' ))
			.filter( Boolean );

		// Just mark as loaded - browser handles fonts via @font-face
		loadedFontTesters.add( fontTester );
		fontTester.classList.add( config.fontsLoadedClass );
		return Promise.resolve();
	}

	const previewObserver = new IntersectionObserver(
		( entries ) => {
			entries.forEach( entry => {
				if ( entry.isIntersecting ) {
					const preview = entry.target;
					const fontFamily = preview.dataset.fontFamily;

					if ( fontFamily ) {
						preview.classList.add( config.fontLoadedClass );
					}

					previewObserver.unobserve( preview );
				}
			} );
		},{
			rootMargin: config.rootMargin,
			threshold: config.threshold
		}
	);

	const visibleLazyTesters = new WeakSet();
	const initializedLazyTesters = new WeakSet();
	const fontTesterCurrentFont = new WeakMap();

	const fontTesterObserver = new IntersectionObserver(
		( entries ) => {
			entries.forEach( entry => {
				if ( entry.isIntersecting ) {
					visibleLazyTesters.add( entry.target );

					if ( ! initializedLazyTesters.has( entry.target ) ) {
						initializedLazyTesters.add( entry.target );

						const fontFamily = entry.target.getAttribute( 'font-family' );

						if ( fontFamily ) {
							const currentFont = fontTesterCurrentFont.get( entry.target );
							if ( currentFont === fontFamily ) {
								return;
							}

							const fontDisplay = entry.target.shadowRoot?.querySelector( 'font-display' );
							if ( fontDisplay ) {
								fontDisplay.style.setProperty( '--font-family', fontFamily );
								fontTesterCurrentFont.set( entry.target, fontFamily );
							}
						}
					}
				}
			});
		},
		{
			rootMargin: config.rootMargin,
			threshold: config.threshold
		}
	);

	document.addEventListener( 'click', ( e ) => {
		if ( e.target.closest( 'select' ) ) {
			return;
		}

		const fontTester = e.target.closest( 'font-tester' );
		if ( fontTester?.dataset.requiresAllWeights === 'true' ) {
			loadAllFontsForTester( fontTester );
		}
	}, true );

	document.addEventListener( 'focus', ( e ) => {
		if ( e.target.closest( 'select' ) ) {
			return;
		}

		const fontTester = e.target.closest( 'font-tester' );
		if ( fontTester?.dataset.requiresAllWeights === 'true' ) {
			loadAllFontsForTester( fontTester );
		}
	}, true );

	document.addEventListener( 'style-change', ( e ) => {
		if ( e.detail.property !== 'fontFamily' ) return;

		const fontTester = e.target.closest( 'font-tester' );
		if ( ! fontTester ) return;
		if ( fontTester.dataset.requiresAllWeights === 'true' ) return;

		if ( ! initializedLazyTesters.has( fontTester ) ) {
			return;
		}

		const currentFont = fontTesterCurrentFont.get( fontTester );
		if ( currentFont === e.detail.value ) {
			return;
		}

		const fontDisplay = fontTester.shadowRoot?.querySelector( 'font-display' );
		if ( fontDisplay && e.detail.value ) {
			fontDisplay.style.setProperty( '--font-family', e.detail.value );
			fontTesterCurrentFont.set( fontTester, e.detail.value );
		}
	}, true );

	function init() {
		document.querySelectorAll( config.eagerSelector ).forEach( preview => {
			const fontFamily = preview.dataset.fontFamily;
			if ( fontFamily ) {
				loadedFonts.add( fontFamily ); // Mark as already loaded
				preview.classList.add( config.fontsLoadedClass );
			}
		});

		document.querySelectorAll( config.lazySelector ).forEach( preview => {
			previewObserver.observe( preview );
		});

		document.querySelectorAll( 'font-tester' ).forEach( tester => {
			fontTesterObserver.observe( tester );
		});
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
