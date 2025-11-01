( function() {
	'use strict';

	const config = {
		eagerSelector: '[data-font-load="eager"]',
		lazySelector: '[data-font-load="lazy"]',
		rootMargin: '300px',
		threshold: 0
	};

	// Load font metadata from JSON
	const metadataElement = document.getElementById( 'font-metadata' );
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

	// Track what's already loaded
	const loadedFonts = new Set();
	const loadedFontTesters = new WeakSet();
	const fontLoadPromises = new Map();

	// Helper: Load a single font
	function loadFont( fontFamily ) {
		if ( loadedFonts.has( fontFamily )) {
			return fontLoadPromises.get( fontFamily ) || Promise.resolve();
		}

		const fontData = fontMetadata[ fontFamily ];
		if (!fontData ) {
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

	// Helper: Load all fonts for font-tester
	function loadAllFontsForTester( fontTester ) {
		if ( loadedFontTesters.has( fontTester ) ) {
			return Promise.resolve();
		}

		const fontStyles = fontTester.querySelectorAll( 'font-style' );
		const families = Array.from( fontStyles )
			.map( el => el.getAttribute( 'family' ))
			.filter( Boolean );

		console.log( 'Loading all weights for font-tester:', families );

		const promises = families.map( family => loadFont( family ));

		return Promise.all( promises ).then(() => {
			loadedFontTesters.add( fontTester );
			fontTester.classList.add( 'fonts-loaded' );
		});
	}

	// 1. VIEWPORT OBSERVER: Load fonts as previews scroll into view
	const previewObserver = new IntersectionObserver(
		( entries ) => {
		entries.forEach( entry => {
			if ( entry.isIntersecting ) {
				const preview = entry.target;
				const fontFamily = preview.dataset.fontFamily;

				if ( fontFamily ) {
					loadFont( fontFamily ).then(() => {
						preview.classList.add( 'font-loaded' );
					} );
				}

				previewObserver.unobserve( preview );
			}
		} );
		},{
			rootMargin: config.rootMargin,
			threshold: config.threshold
		}
	);

	document.addEventListener( 'click', ( e ) => {
		// Skip if clicking on select elements to avoid closing them during font load
		if ( e.target.tagName === 'SELECT' || e.target.closest( 'select' ) ) {
			return;
		}

		const fontTester = e.target.closest( 'font-tester' );
		if ( fontTester && fontTester.dataset.requiresAllWeights === 'true' ) {
			loadAllFontsForTester( fontTester );
		}
	}, true );

	// Listen for focus events ( dropdowns, inputs )
	document.addEventListener( 'focus', ( e ) => {
		// Skip if focusing on select elements to avoid closing them during font load
		if ( e.target.tagName === 'SELECT' || e.target.closest( 'select' ) ) {
			return;
		}

		const fontTester = e.target.closest( 'font-tester' );
		if ( fontTester && fontTester.dataset.requiresAllWeights === 'true' ) {
			loadAllFontsForTester( fontTester );
		}
	}, true );

	// 3. INITIALIZE: Observe all previews
	function init() {
		// eager previews: already preloaded, just mark them
		document.querySelectorAll( config.eagerSelector ).forEach( preview => {
		const fontFamily = preview.dataset.fontFamily;
		if ( fontFamily ) {
			loadedFonts.add( fontFamily ); // Mark as already loaded
			preview.classList.add( 'font-loaded' );
		}
		});

		document.querySelectorAll( config.lazySelector ).forEach( preview => {
			previewObserver.observe( preview );
		});

		// TODO: Remove in prod
		console.log( 'Font loading initialized:', {
			totalFonts: Object.keys( fontMetadata ).length,
			preloadedFonts: loadedFonts.size
		} );
	}

	// Start when DOM is ready
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
