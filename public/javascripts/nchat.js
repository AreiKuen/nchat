var
	username,
	server = window.location,
	activechat = '#rMainRoom',
	chats = [], 
	socket = io.connect(server);

socket.on('connect', function () {
	setTimeout(function () {
		$("#loadText").text("Connected!").css('color', '#0C0');
		$("#loadHolder").fadeOut("normal", function () {
			$(this).html('<img src="/images/logo.png" alt="Logo"/>' +
				'<input id="nameInput" type="text" placeholder="Nickname" /><br/>' +
				'<input id="nameSubmit" onClick="' + "submitName($('#nameInput').val());" + '" type="button" value="Join"/>');
			checkCake();
			$('#nameInput').keypress(function (e) {
				if (e.which == 13) {
					$(this).blur();
					$("#nameSubmit").focus().click().blur();
				}
			});
			$(this).fadeIn("fast", function () {
				$("#nameInput").val('').focus();
				checkCake();
			});
		});
	}, 1000);
});

socket.on('validated', function (username) {
	window.username = username;
	setCake("username", username, 365);
	$("#loading").fadeOut("fast", function () {
		$(this).hide();
		$('#loadHolder').html('');
	});
	$("#chatInput").val('').focus();
})

socket.on('updatechat', function (username, data, chat) {
	var
		color = '#000';

	if ($('#' + chat).length == 0 && username != 'SERVER' && username != window.username) {
		socket.emit('privatereq', username, data);
		return;
	}

	if (data.substring(0, 3) === "/me") {
		$('<span/>', {	
			style: 'color: #A0A;',
			html: username + ' ' + data.substring(3) + '<br />'
		}).appendTo('#' + chat);
    	return;
	}

	if (username == "SERVER") {
		color = '#C00'
	} else if (chat.substr(0, 1) == 'p') {
		$.titleAlert("New chat message!", {
		    requireBlur: true,
		    stopOnFocus: true,
		    duration: 0,
		    interval: 1000
		});
	}

	data = '<b><span style="color: ' + color + ';">' + username +
		'</span>:</b> ' + data + '<br/>';

	$('#' + chat).append(data);

	var objDiv = document.getElementById(chat); 
	objDiv.scrollTop = objDiv.scrollHeight;
});

socket.on('updateusername', function (username) {
	window.username = username;
});

socket.on('updatemedia', function (username, data, room) {
	if ($('#' + room).length == 0 && username != 'SERVER' && username != window.username) {
		socket.emit('privatereq', username, data);
		return;
	}

	if ($('#m' + room).html().indexOf(data.substr(data.indexOf("embed") + 6, 11)) == -1) {
		$('#m' + room).append('<b>' + username + '</b>' +
			'<br/>' + data + '<br/>');
	} else {
		smoke.alert('Duplicate post!');
	}
});

socket.on('updateusers', function (data) {
	$('#users').empty();
	$.each(data, function (key, value) {
		if (key == username || key == "Mater")
			key = "<b>" + key + "</b>";
		$('<div/>', {
			class: 'user',
			onclick: 'privatereq($(this).text());',
			html: key
		}).appendTo('#users');
	});
	$('.user:odd').css("background","#EEE");
});

socket.on('updatetabs', function (data, select) {
	$('#tabHolder').empty();
	$('<div/>', {
		id: 'rooms',
		onclick: 'roomPicker();',
		text: '+'
	}).appendTo('#tabHolder');

	$.each(data, function (key, value) {
		if (key.substr(0, 1) == '#') {
			if ($('#r' + key).length == 0) {
				$('<div/>', {
					class: 'conversation',
					id: 'r' + key.substr(1)
				}).appendTo('#conversationHolder');
				$('<div/>', {
					class: 'media',
					id: 'mr' + key.substr(1)
				}).appendTo('#conversationHolder');
				$('<div/>', {
					class: 'users',
					id: 'ur' + key.substr(1)
				}).appendTo('#usersHolder');
			}
		} else {
			if ($('#p' + key).length == 0) {
				$('<div/>', {
					class: 'conversation',
					id: 'p' + key
				}).appendTo('#conversationHolder');
				$('<div/>', {
					class: 'media',
					id: 'mp' + key
				}).appendTo('#conversationHolder');
				$('<div/>', {
					class: 'users',
					id: 'up' + key
				}).appendTo('#usersHolder');
			}
		}

		$('<div/>', {
			class: 'tab',
			id: (key.substr(0, 1) == '#' ? chats[key.substr(1)] = key.substr(1) : chats[key] = key),
			html: '<div id="ttxt' + key + '">' + key + '</div><div class="x" onclick="closeRoom(' +
			(key.substr(0, 1) == '#' ? "'#'+$(this).parent().attr('id')" : "$(this).parent().attr('id')") +
			');"' + '">x</div>' 
		}).appendTo('#tabHolder');
	});
	$('.tab').live('click', function (event) {
		if (event.which == 1) {
			changeRoom($(this).text().substr(0, $(this).text().length - 1));
		}
	});

	if (select == 0) {
		for (var key in chats) {
			$('#' + chats[key]).get(0).click();
    		break;
		}
		return;
	}

	if (chats[select] != undefined) {
		$('#' + chats[select]).get(0).click();
	}
	$('#chatInput').focus();
});

socket.on('disconnect', function () {
	document.location.reload(true);
});	

function privatereq (username) {
	socket.emit('privatereq', username);
}

socket.on('startprivate', function (username) {
	$('.conversation').hide();
	$('#p' + username).show();
	$('#' + username).get(0).click();
});

socket.on('errormsg', function (message) {
	smoke.alert(message);	
});