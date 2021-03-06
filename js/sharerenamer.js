/* global OC, $, t */

var ShareRenamer = function(baseUrl) {
	this._baseUrl = baseUrl;
};

ShareRenamer.prototype = {
	Rename: function(old_token, new_token) {
		// this._baseUrl already ends with /rename, found in routes.php
		var result = 'error';
		var request = $.ajax({
			url: this._baseUrl,
			data: {'old_token' : old_token, 'new_token' : new_token},
			method: 'POST',
			async: false
		});
		
		request.done(function(msg) {
			// will be 'exists' or 'pass'
			result = msg;
		});

		request.fail(function( jqXHR, textStatus ) {
			OC.Notification.show(t('sharerenamer', 'Error') + ': ' + textStatus, { type: 'error' });
		});
		
		return result;
	}
};

var ShareRenamerFiles = {};