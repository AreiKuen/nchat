/////////////////////////
//KLIJENTSKI INTERFEJS///
/////////////////////////

$(document).ready(function () {
	$('#sendButton').click(function () {
		var message = $('#chatInput').val();
		$('#chatInput').val('').focus();
		socket.emit('sendchat', message, activeroom);
	});

	$('#chatInput').keypress(function (e) {
		if (e.which == 13) {				
			if ($(this).val() !== "") {
				$(this).blur();
				$("#sendButton").focus().click();
			}
			return false;
		}
	});

	$('#chatInput').click(function () {
		$(".conversation").click();
		$(this).focus();
	});
});

function submitName (name) {
	if (name == "") {
		$("#nameInput").focus();
		return;
	}
	socket.emit('login', name);
}

var 
	rooms = ['MainRoom', 'Gaming', 'Movies', 'Social', 'Random'],
	selectedRoom;
function roomPicker () {
	var
		roomshtml = "";
	for (index in rooms) {
		roomshtml += '<li onclick="selectRoom($(this).text());" class="roomListRoom">' + rooms[index] + '</li>';
	}
	$('#loadHolder').html(
		'<ul id="roomList">' + roomshtml + '</ul>' +
		'<input id="joinRoom" type="button" value="Join" onclick="joinRoom();"/>'
	);
	$('.roomListRoom:odd').css('background', '#DDD');
	$('#loading').fadeIn();
}

function selectRoom (room) {
	selectedRoom = 'r' + room;
}

function joinRoom () {
	$('#loading').fadeOut();
	chats[selectedRoom.substr(1)] = selectedRoom.substr(1);
	socket.emit('joinroom', selectedRoom);
}

function changeRoom (room) {
	$('.tab').css({'background':'#FFF',
				   'color':'#000',
				   'font-weight':'normal'});
	$('.conversation').hide();
	$('.media').hide();
	if (room.indexOf("#") !== -1) {
		$(room).css({'background':'#D00',
				 'color':'#FFF'});
		$("#r" + room.substr(1)).show();
		$('#mr' + room.substr(1)).show();
		activeroom = "r" + room.substr(1);
	} else {
		$('#' + room).css({'background':'#D00',
				 'color':'#FFF'});
		$("#p" + room).show();
		$('#mp' + room).show();
		activeroom = "p" + room;
	}
}

function closeRoom (room) {
	if (room.substr(0, 1) === "#") {
		$('#' + room.substr(1)).remove();
		$('#r' + room.substr(1)).remove();
		delete chats[room.substr(1)];
		socket.emit('leaveroom', 'r' + room.substr(1));
	} else {
		$('#' + room).remove();
		$('#p' + room).remove();
		delete chats[room];
	}
	socket.emit('closechat', room);
}

function setCake (cake_name, value, exdays) {
    var
        cake_value,
        exdate = new Date();

    exdate.setDate(exdate.getDate() + exdays);
    cake_value = encodeURIComponent(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = cake_name + "=" + cake_value;
}

function getCake (cake_name) {
    var
        i, x, y,
        ARRcookies = document.cookie.split(";");
   		
    for (i = 0; i < ARRcookies.length; i += 1) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x === cake_name) {
            return decodeURIComponent(y);
        }
    }
}

function checkCake () {
    var
        username = getCake("username");

    if (username != null) {
    	$("#nameInput").val(username);
    }
}