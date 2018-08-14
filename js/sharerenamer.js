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
			alert(t('core', 'Error') + ': ' + textStatus);
		});
		
		return result;
	}
};

var ShareRenamerFiles = {};

ShareRenamerFiles.hijackShare = function () {
	var ShareDialogLinkShareViewRender = OC.Share.ShareDialogLinkShareView.prototype.render;
	OC.Share.ShareDialogLinkShareView.prototype.render = function () {
		var r = ShareDialogLinkShareViewRender.apply(this, arguments);

		var $linkRenamerButtonElement = this.$el.find('#linkRenamerButton');
		var $linkTextMenu = this.$el.find('.linkTextMenu');
		var $clipboardButtonMenuItem = this.$el.find('.clipboardButton').parent();
		var $linkText = this.$el.find('.linkText');
		var $checkBox = this.$el.find('.linkCheckbox');
		var fileInfoModel = this.model.fileInfoModel;

		$shareRenamerButtonMenuItem = 
		'<li>' +
			'<a href="#" id="startShareRenamer" class="menuitem">' +
				'<span class="icon icon-edit"></span>' + 
				'<span>' + t('core', 'Link') + ' ' + t('core', 'Rename').toLowerCase() + '</span>' + 
			'</a>' +
		'</li>';
		$clipboardButtonMenuItem.after($shareRenamerButtonMenuItem);

		if (!$linkRenamerButtonElement.length) {
			var linktxt = $linkText.val();
			if (linktxt == "" || linktxt == null || linktxt == false || typeof(linktxt) == 'undefined') {
				var token = '???';
			} else {
				var n = linktxt.lastIndexOf("/");
				var token = linktxt.substr(n + 1);
			}
			$linkRenamerButtonElement = 
				'<li>' +
				'<span>' +
					'<input id="linkRenamerButton" type="button" class="hidden button" value="' + t('core', 'Link') + ' ' + t('core', 'Rename').toLowerCase() + '" />' +
					'<input id="ShareRenamerNew" type="text" class="hidden" placeholder="' + token + '" autocomplete="off" spellcheck="false" autocorrect="off" />' +
					'<br>' +
					'<input id="ShareRenamerSave" type="button" class="button hidden" value="' + t('core', 'Rename') + '" />' +
					'<input id="ShareRenamerCancel" type="button" class="button hidden" value="' + t('core', 'Cancel') + '" />' +
				'</span></li>';
			$linkTextMenu.after($linkRenamerButtonElement);
		}

		$('#startShareRenamer').click(function () {			
			$linkTextMenu.toggleClass('hidden');
			$('#linkRenamerButton').toggleClass('hidden');
		});

		$('#linkRenamerButton').click(function () {
			$('#linkRenamerButton').hide();
			$('#ShareRenamerNew').show();
			$('#ShareRenamerSave').show();
			$('#ShareRenamerCancel').show();
			$('#ShareRenamerNew').focus();
		});
		$('#ShareRenamerCancel').click(function () {
			$('#ShareRenamerNew').val('');
			$('#ShareRenamerSave').click();
		});
		$('#ShareRenamerNew').keyup(function () {
			var rx = /^[a-zA-Z0-9\-_]+$/g;
			if ($(this).val() != '' && !rx.test($(this).val())) {
				$(this).tooltip({
					placement: 'bottom',
					trigger: 'manual',
					title: t('core', 'Only %s is available.').replace('%s', ' a-z, A-Z, 0-9, -, _ ')
				});
				$(this).tooltip('show');
			} else {
				$(this).tooltip('hide');
			}
		});
		$('#ShareRenamerSave').click(function () {
			$('#shareTabView input').attr('disabled', false);
			var linktxt = $('.linkText').val();
			var n = linktxt.lastIndexOf("/");
			var old_token = linktxt.substr(n + 1);
			var new_token = $('#ShareRenamerNew').val();
			var rx = /^[a-zA-Z0-9\-_]+$/g;

			if (new_token == old_token) {
				$('#ShareRenamerNew').val('');

			} else if (new_token != '' && !rx.test(new_token)) {
				// tooltip is shown, so just don't do anything
				$('#ShareRenamerNew').select();
				return false;

			} else if (new_token != '') {
				var init = new ShareRenamer(OC.generateUrl('/apps/sharerenamer/rename'));
				var exec = init.Rename(old_token, new_token);

				if (exec == 'pass') {
					$linkText.val($linkText.val().replace(old_token, new_token));
					$('#ShareRenamerNew').attr('placeholder', new_token);
					$('#ShareRenamerNew').val('');
				} else if (exec == 'exists') {
					alert(t('files', '{newname} already exists').replace('{newname}', "'" + new_token + "'") + '.');
					$('#ShareRenamerNew').select();
					return false;
				} else if (exec == 'error') {
					// alert is in AJAX call already
					return false;
				}
			}
			$('#linkRenamerButton').show();
			$('#ShareRenamerNew').hide();
			$('#ShareRenamerSave').hide();
			$('#ShareRenamerCancel').hide();
		});

		return r;
	};
};


$(document).ready(function () {

		if ($('#body-login').length > 0) {
			return true; //deactivate on login page
		}

		if ($('#filesApp').val()) {
			$('#fileList').one('updated', ShareRenamerFiles.hijackShare);
		}

	}
);
