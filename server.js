//TO DO
//svaki chat treba da ima poseban media div i user listu

var express = require('express.io') //moduli koje koristimo za server
  , server = express() //express server
  , http = require('http') //http server
  , srv = http.createServer(server)
  , io = require('socket.io').listen(srv) //socket.io koji upravlja saobracajem socketa
  , routes = require('./routes') 
  , user = require('./routes/user')
  , path = require('path')
  , VERSION = 'v0.5.6';

srv.listen(3000); //server slusa na portu 3000
console.log('Server started and listening.');

server.configure(function(){
  server.set('port', process.env.PORT || 3000);
  server.set('views', __dirname + '/views');
  server.set('view engine', 'jade'); //koristimo Jade za formatovanje HTML dokumenta
  server.use(express.favicon());
  server.use(express.logger('dev'));
  server.use(express.bodyParser());
  server.use(express.methodOverride());
  server.use(express.cookieParser());
  server.use(express.session({secret: 'filipfilipfilip12341filip' }));
  server.use(server.router);
  server.use(require('stylus').middleware(__dirname + '/public')); //koristimo stylus za formatovanje CSS fajlova
  server.use(express.static(path.join(__dirname, 'public')));
});

server.configure('development', function(){
  server.use(express.errorHandler());
  server.locals.pretty = true;
});

server.get('/', routes.index);
server.get('/users', user.list);

var usernames = {}, //hashmape (['key'] = value)
	sockets = {},
	banane = {},
	rooms = {},
	userNum = 0; //broj korisnika na server

roomNames = ['MainRoom', 'Gaming', 'Movies', 'Social', 'Random'];
for (index in roomNames) {
	rooms['r' + roomNames[index]] = {};
}

io.sockets.on('connection', function (socket) { //dogadjaj pri prijemu nove socket veze, svaki socket ima sopstvenu kontrolu
												//definisanu ispod
	var
		chats = {}, //lista razgovora korisnika
		msgCount = 0, //broj opslatih poruka
		info = socket.manager.handshaken[socket.id].address, //adresa korisnika
		postmedia = true; //zabrana postovanja multimedijalnog sadrzaja

	console.log(info.address + ":" + info.port + " connected.");
	setInterval(function () { //svake 2sec proveravamo da li je korisnik poslao vise od 5 poruka
		if (msgCount > 5) { //ako jeste, upisujemo ga u Ban listu sa timeoutom 30sec posle kog se brise iz ban liste
			banane[socket.username] = socket.username;
			console.log('Ban issued for user ' + socket.username);
			setTimeout(function () {
				delete banane[socket.username];
				console.log("Ban lifted for user " + socket.username);
			}, 30000); //30sec
			socket.disconnect();
		}
		msgCount = 0;
	}, 2000);

	socket.on('login', function (username) { //dogadjaj pri prijavi nadimka na server
		var
			i = 1,
			check = username;

		if (banane[username] == username) { //ako je na ban listi, prekidamo vezu i bezimo iz funkcije
			socket.emit('errormsg', 'You have been banned for 30sec.');
			setTimeout(function () { socket.disconnect(); }, 2000); //ban message
			return;
		}

		if (username == null) { //ako nadimak nije definisan iz nekog cudnog razloga, prekidamo vezu
			socket.disconnect();
		}

		if (username.toLowerCase() == "server" || username.substr(0, 1) == '#' || username.trim() == "") {//gluposti ako neko ukuca nadimak server
			socket.emit('errormsg', 'You are not allowed to use that nickname.');
			return;
		} else if (username == "Mater")			//ili ako napise nadimak Mater koji ja koristim dok testiram server			
			username = "NisiMater";
		else if (username == "Mater#12341")		//samo ovako je moguce prijaviti se kao Mater
			username = "Mater";

		while (usernames[username] == username) { //ako prosledjeni nadimak vec postoji na listi korisnika na serveru
			username = check + "_" + i;			//dodajemo mu broj koji povecavamo sve dok ne bude unikatan nadimak
			i++;
		}

		username = username.replace(/</g, "&lt");
		username = username.replace(/>/g, "&gt"); //zastita od gluposti tipa </div> koje bi napravile dzumbus u html dokumentu
		socket.username = username; 
		///////////////////////////
		sockets[username] = socket;	//dodajemo socket u listu socketa na serveru
		///////////////////////////
		userNum++; //povecamo broj korisnika
		usernames[username] = username; //dodamo nadimak u listu nadimaka
		rooms['rMainRoom'][socket.username] = socket;
		chats['#MainRoom'] = '#MainRoom'; //dodajemo MainRoom u listu soba
		socket.emit('validated', username);
		socket.emit('updatetabs', chats, 'MainRoom'); //oznacavamo tab MainRoom
		socket.emit('updateusername', username); //vracamo klijentu finalan nadimak
		socket.emit('updatechat', 'SERVER', //ispisujemo dobrodoslicu u #MainRoom sobi
			'You are now connected to Arei Kuen\'s ' +
			'multimedia chat server ' + VERSION, 'rMainRoom');
		socket.emit('updatechat', 'SERVER', 'Try posting a YouTube video link!', 'rMainRoom');
		socket.broadcast.emit('updatechat', 'SERVER', username + //ispisujemo svima osim trenutnom korisniku
			' has connected.', 'rMainRoom');					//da je korisnik usao u sobu
		io.sockets.emit('updateusers', usernames); //objavljujemo novu listu korisnika svim korisnicima na serveru

	});

	socket.on('sendchat', function (data, room) { //pri prijemu chat poruke
		//data je poruke, room je soba u koju cemo je ispisati
		//message obrada..
		/////////////////////////////////
		data = data.replace(/</g, "&lt");
		data = data.replace(/>/g, "&gt"); //ponovo zastita od html tagova

		if (data.indexOf(":)") !== -1) { //ako u poruci ima smajli, zamenimo ga odgovarajucom slicicom
			data = data.replace(/:\)/g, "<img class='smiley' src='/images/smileys/smile.gif'/>");
		}

		if (data.indexOf(":(") !== -1) {
			data = data.replace(/:\(/g, "<img class='smiley' src='/images/smileys/sad.gif'/>");
		}

		if (data.indexOf(";)") !== -1) {
			data = data.replace(/;\)/g, "<img class='smiley' src='/images/smileys/wink.gif'/>");
		}

		if (data.indexOf(":@") !== -1) {
			data = data.replace(/:\@/g, "<img class='smiley' src='/images/smileys/angry.gif'/>");
		}

		if (data.indexOf(":D") !== -1) {
			data = data.replace(/:\D/g, "<img class='smiley' src='/images/smileys/haha.gif'/>");
		}

		if (data.indexOf(":P") !== -1) {
			data = data.replace(/:\P/g, "<img class='smiley' src='/images/smileys/tongue.gif'/>");
		}

		if (data.indexOf("?v=") !== -1) { //ako u poruci ima ?v= sto bi trebao da je ytube video ako neko nije skontao kako funkcionise
			if (!postmedia) {				//pa namerno pise gluposti za sta nisam uradio neku proveru
				socket.emit('errormsg', 'You can only post media every 2min.'); //ako je postmedia false, vracamo poruku da ne moze da spamuje video linkove
				return;
			}

			var ytube = data.substr(data.indexOf("?v=") + 3, 11); //izdvojimo kod youtube videa
			data = "<iframe style='z-index: 1;' width='300' height='200' src='http://www.youtube.com/embed/" + ytube +
				"' frameborder='0' allowfullscreen></iframe>"; //ubacimo ga u iframe
			
			if (room.substr(0, 1) == "p") { //ako se salje u privatan razgovor, saljemo samo sebi i tom korisniku
				if (sockets[room.substr(1)] != undefined) {
					sockets[room.substr(1)].emit('updatemedia', socket.username, data, "p" + socket.username);
					socket.emit('updatemedia', socket.username, data, room);
				} else {
					socket.emit('updatechat', 'SERVER', room.substr(1) + ' is offline.', room);
				}
			} else {
				io.sockets.emit('updatemedia', socket.username, data, room); //objavimo klijentima u posebnom divu desno
			}
			//postmedia = false; //podesimo zabranu postovanja videa
			//setTimeout(function () { //posle 2min zabrana se ponistava
			//	postmedia = true;
			//}, 120000); //2min
			return;
		}
		/////////////////////////////////////////
			
		msgCount++; //povecamo broj poruka
		if (room.substr(0, 1) == "p") { //ako se salje u privatan razgovor, saljemo samo sebi i tom korisniku
			if (sockets[room.substr(1)] != undefined) {
				sockets[room.substr(1)].emit('updatechat', socket.username, data, "p" + socket.username);
				socket.emit('updatechat', socket.username, data, room);
			} else {
				socket.emit('updatechat', 'SERVER', room.substr(1) + ' is offline.', room);
			}
		} else { //u suprotnom svima u sobi
			for (user in rooms[room]) {
				rooms[room][user].emit('updatechat', socket.username, data, room);
			}
		}
	});

	socket.on('privatereq', function (username, data) { //zahtev za privatan razgovor
		if (username == usernames[username] && username != socket.username) { //ako nismo kliknuli na svoj nadimak i ako je osoba povezana na server
			chats[username] = username; //dodajemo nadimak kliknute osobe u listu razgovora
			socket.emit('updatetabs', chats, username); //dodajemo tab te osobe
			socket.emit('startprivate', username); //zapocinjemo razgovor
			if (data != undefined) {
				if (data.substr('?v=') !== -1) {
					socket.emit('updatemedia', username, data, 'p' + username);
				} else {
					socket.emit('updatechat', username, data, 'p' + username);
				}
			} //u slucaju da je osoba zatvorila tab razgovora
		} else {	//ponovo saljemo poruku posto su ga pozivi iznad stvorili
			//~~ne secam se sta sam ovde hteo
		}

	});

	socket.on('closechat', function (room) { //kad kliknemo na iksic kod razgovora
		delete chats[room];	//brisemo razgovor sa liste na serveru
		socket.emit('updatetabs', chats, 0); //popunjavamo tabove novom listom
	});

	socket.on('joinroom', function (room) {
		rooms[room][socket.username] = socket;
		if (chats['#' + room.substr(1)] == undefined) {
			chats['#' + room.substr(1)] = '#' + room.substr(1);
		}
		socket.emit('updatetabs', chats, room.substr(1));
	});

	socket.on('leaveroom', function (room) {
		delete rooms[room][socket.username]; //obavezno i na diskonektu otom potom
		delete chats['#' + room.substr(1)];
	});

	socket.on('disconnect', function () { //kad korisnik izgubi vezu sa serverom
		delete usernames[socket.username];	//brisemo njegov nadimak sa liste
		delete sockets[socket.username];	//brisemo njegov socket sa liste
		for (chat in chats) {
			if (chats[chat].substr(0, 1) == '#')
				delete rooms['r' + chats[chat].substr(1)][socket.username];
		}
		userNum--;	//smanjimo broj korisnika
		io.sockets.emit('updateusers', usernames); //objavimo listu korisnika
		//if (socket.username != undefined) //ako je moguce, objavimo da je korisnik izgubio vezu
		//	socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected.');
	});
});