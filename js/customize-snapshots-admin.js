( function( $ ) {

	$( function() {
		var $link, linkText, linkActions, dataSlug, initializeLink;

		$link = $( '.cs-toggle-action' );
		linkText = [ 'Remove setting', 'Restore setting' ];
		linkActions = [ 'remove', 'restore' ];
		dataSlug = 'cs-action';

		initializeLink = function() {
			$link.text( linkText[ 0 ] )
				.data( dataSlug, linkActions[ 0 ] );
		};

		initializeLink();

		$link.on( 'click', function( event ) {
			var $clickedLink, $settingDisplay, clickedLinkAction, settingId;

			event.preventDefault();

			$clickedLink = $( this );
			$settingDisplay = $( this ).parents( 'details' );
			clickedLinkAction = $( this ).data( dataSlug );
			settingId = $( this ).attr( 'id' );

			this.isLinkSetToRemoveSetting = function() {
				return ( linkActions[ 0 ] === clickedLinkAction );
			};

			this.hideSettingAndChangeLinkText = function() {
				$clickedLink.text( linkText[ 1 ] )
					.data( dataSlug, linkActions[ 1 ] )
					.after( this.constructHiddenInputWithValue( settingId ) );
				$settingDisplay.removeAttr( 'open' )
					.addClass( 'cs-removed' );
			};

			this.constructHiddenInputWithValue = function( settingId ) {
				return $( '<input>' ).attr( {
					'name': 'customize_snapshot_remove_settings[]',
					'type': 'hidden'
				})
				.val( settingId );
			};

			this.isLinkSetToRestoreSetting = function() {
				return ( linkActions[ 1 ] === clickedLinkAction );
			};

			this.showSettingAndChangeLinkText = function() {
				$clickedLink.text( linkText[ 0 ] )
					.data( dataSlug, linkActions[ 0 ] );
				this.removeHiddenInputWithValue( settingId );
				$settingDisplay.removeClass( 'cs-removed' );
			};

			this.removeHiddenInputWithValue = function( settingId ) {
				$( 'input[value="' + settingId + '"]' ).remove();
			};

			if ( this.isLinkSetToRemoveSetting() ) {
				this.hideSettingAndChangeLinkText();
			} else if ( this.isLinkSetToRestoreSetting() ) {
				this.showSettingAndChangeLinkText();
			}

		} );

	} );
}( jQuery ) );
