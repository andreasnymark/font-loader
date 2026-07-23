/**
 * Lazy load fonts using the FontFace API and IntersectionObserver.
 * @author Andreas Nymark <andreas@nymark.co>
 * @license MIT
 * @version 1.3.0
 * @link https://github.com/andreasnymark/font-loader
 */

export const config = Object.assign( {
	eagerSelector: '[data-font-load="eager"]',
	lazySelector: '[data-font-load="lazy"]',
	metadataSelector: '#font-metadata',
	fontLoadedClass: 'font-loaded',
	fontLoadingClass: 'font-loading',
	fontLoadingDelay: 300,
	rootMargin: '300px',
	threshold: 0,
	applyFont: false,
}, window.FontLoaderConfig || {} );

const metadataElement = document.querySelector( config.metadataSelector );
if ( ! metadataElement ) {
	console.warn( 'font-metadata element not found, font loading disabled' );
}

let fontMetadata = {};
if ( metadataElement ) {
	try {
		fontMetadata = JSON.parse( metadataElement.textContent );
	} catch ( err ) {
		console.error( 'Failed to parse font metadata:', err );
	}
}

const fontLoadPromises = new Map();

// Delay adding the loading class so fast connections don't get a flash of it
export function trackLoadingClass( preview, promise, extraLoadedClasses = [] ) {
	preview.classList.remove( config.fontLoadedClass, ...extraLoadedClasses );

	const timeoutId = setTimeout( () => {
		preview.classList.add( config.fontLoadingClass );
	}, config.fontLoadingDelay );

	promise.finally( () => {
		clearTimeout( timeoutId );
		preview.classList.remove( config.fontLoadingClass );
	});
}

export function loadFont( fontFamily ) {
	if ( fontLoadPromises.has( fontFamily ) ) {
		return fontLoadPromises.get( fontFamily );
	}

	const fontData = fontMetadata[ fontFamily ];
	if ( ! fontData ) {
		console.warn( 'Font not found:', fontFamily );
		return Promise.resolve();
	}

	const fontFace = new FontFace(
		fontData.family,
		`url(${fontData.url})`,
		{
			weight: fontData.weightValue || 'normal',
			style: fontData.style || 'normal',
			stretch: fontData.stretch || 'normal',
			display: 'block',
		}
	);

	// Add before loading so FontFaceSet events (loadingdone) fire on completion
	document.fonts.add( fontFace );

	const promise = fontFace.load()
	.then( () => {
		// FontFaceSet loadingdone is unreliable in WebKit; consumers listen for this instead
		document.dispatchEvent( new CustomEvent( 'font-loaded', {
			detail: { fontFamily, family: fontData.family }
		} ) );
	})
	.catch( err => {
		document.fonts.delete( fontFace );
		console.error( 'Failed to load font:', fontData.name, err );
	});

	fontLoadPromises.set( fontFamily, promise );
	return promise;
}

const previewObserver = new IntersectionObserver(
	( entries ) => {
		entries.forEach( entry => {
			if ( entry.isIntersecting ) {
				const preview = entry.target;
				const fontFamily = preview.dataset.fontFamily;

				if ( fontFamily ) {
					const fontData = fontMetadata[ fontFamily ];
					preview.style.fontStyle = fontData?.style || 'normal';
					preview.style.fontWeight = fontData?.weightValue || 'normal';
					const promise = loadFont( fontFamily );
					trackLoadingClass( preview, promise );
					promise.then( () => {
						preview.classList.add( config.fontLoadedClass );
						if ( config.applyFont ) preview.style.fontFamily = `'${fontData?.family}'`;
					});
				}

				previewObserver.unobserve( preview );
			}
		} );
	},{
		rootMargin: config.rootMargin,
		threshold: config.threshold
	}
);

function init() {
	document.querySelectorAll( config.eagerSelector ).forEach( preview => {
		const fontFamily = preview.dataset.fontFamily;
		if ( fontFamily ) {
			const fontData = fontMetadata[ fontFamily ];
			preview.style.fontStyle = fontData?.style || 'normal';
			preview.style.fontWeight = fontData?.weightValue || 'normal';
			const promise = loadFont( fontFamily );
			trackLoadingClass( preview, promise );
			promise.then( () => {
				preview.classList.add( config.fontLoadedClass );
				if ( config.applyFont ) preview.style.fontFamily = `'${fontData?.family}'`;
			});
		}
	});

	document.querySelectorAll( config.lazySelector ).forEach( preview => {
		previewObserver.observe( preview );
	});
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
