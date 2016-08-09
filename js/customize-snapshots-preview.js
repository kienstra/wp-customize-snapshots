/* global jQuery, JSON */
/* exported CustomizeSnapshotsPreview */
/* eslint consistent-this: [ "error", "section" ], no-magic-numbers: [ "error", { "ignore": [-1,0,1] } ] */

/*
 * The code here is derived from Customize REST Resources: https://github.com/xwp/wp-customize-rest-resources
 */

var CustomizeSnapshotsPreview = (function( api, $ ) {
	'use strict';

	var component = {
		data: {
			home_url: {
				scheme: '',
				host: '',
				path: ''
			},
			rest_api_url: {
				scheme: '',
				host: '',
				path: ''
			},
			admin_ajax_url: {
				scheme: '',
				host: '',
				path: ''
			},
			initial_dirty_settings: []
		}
	};

	/**
	 * Init.
	 *
	 * @param {object} args Args.
	 * @param {string} args.uuid UUID.
	 * @returns {void}
	 */
	component.init = function init( args ) {
		_.extend( component.data, args );

		component.injectSnapshotIntoAjaxRequests();
	};

	/**
	 * Get customize query vars.
	 *
	 * @see wp.customize.previewer.query
	 *
	 * @returns {{
	 *     customized: string,
	 *     nonce: string,
	 *     wp_customize: string,
	 *     theme: string
	 * }} Query vars.
	 */
	component.getCustomizeQueryVars = function getCustomizeQueryVars() {
		var customized = {};
		api.each( function( setting ) {
			if ( setting._dirty || -1 !== _.indexOf( component.data.initial_dirty_settings, setting.id ) ) {
				customized[ setting.id ] = setting.get();
			}
		} );
		return {
			wp_customize: 'on',
			theme: api.settings.theme.stylesheet,
			nonce: api.settings.nonce.preview,
			customized: JSON.stringify( customized )
		};
	};

	/**
	 * Inject the snapshot UUID into Ajax requests.
	 *
	 * @return {void}
	 */
	component.injectSnapshotIntoAjaxRequests = function injectSnapshotIntoAjaxRequests() {
		$.ajaxPrefilter( component.prefilterAjax );
	};

	/**
	 * Rewrite Ajax requests to inject Customizer state.
	 *
	 * This will not work 100% of the time, such as if an Admin Ajax handler is
	 * specifically looking for a $_GET param vs a $_POST param.
	 *
	 * @param {object} options Options.
	 * @param {string} options.type Type.
	 * @param {string} options.url URL.
	 * @param {object} originalOptions Original options.
	 * @param {XMLHttpRequest} xhr XHR.
	 * @returns {void}
	 */
	component.prefilterAjax = function prefilterAjax( options, originalOptions, xhr ) {
		var requestMethod, urlParser, queryVars, isMatchingHomeUrl, isMatchingRestUrl, isMatchingAdminAjaxUrl;

		urlParser = document.createElement( 'a' );
		urlParser.href = options.url;

		isMatchingHomeUrl = urlParser.host === component.data.home_url.host && 0 === urlParser.pathname.indexOf( component.data.home_url.path );
		isMatchingRestUrl = urlParser.host === component.data.rest_api_url.host && 0 === urlParser.pathname.indexOf( component.data.rest_api_url.path );
		isMatchingAdminAjaxUrl = urlParser.host === component.data.admin_ajax_url.host && 0 === urlParser.pathname.indexOf( component.data.admin_ajax_url.path );

		if ( ! isMatchingHomeUrl && ! isMatchingRestUrl && ! isMatchingAdminAjaxUrl ) {
			return;
		}

		requestMethod = options.type.toUpperCase();

		// Customizer currently requires POST requests, so use override (force Backbone.emulateHTTP).
		if ( 'POST' !== requestMethod ) {
			xhr.setRequestHeader( 'X-HTTP-Method-Override', requestMethod );
			options.type = 'POST';
		}

		if ( options.data && 'GET' === requestMethod ) {
			/*
			 * Make sure the query vars for the REST API persist in GET (since
			 * REST API explicitly look at $_GET['filter']).
			 * We have to make sure the REST query vars are added as GET params
			 * when the method is GET as otherwise they won't be parsed properly.
			 * The issue lies in \WP_REST_Request::get_parameter_order() which
			 * only is looking at \WP_REST_Request::$method instead of $_SERVER['REQUEST_METHOD'].
			 * @todo Improve \WP_REST_Request::get_parameter_order() to be more aware of X-HTTP-Method-Override
			 */
			if ( urlParser.search.substr( 1 ).length > 1 ) {
				urlParser.search += '&';
			}
			urlParser.search += options.data;
		}

		// Add Customizer post data.
		if ( options.data ) {
			options.data += '&';
		} else {
			options.data = '';
		}
		queryVars = component.getCustomizeQueryVars();
		queryVars.wp_customize_preview_ajax = 'true';
		options.data += $.param( queryVars );
	};

	return component;
} )( wp.customize, jQuery );
