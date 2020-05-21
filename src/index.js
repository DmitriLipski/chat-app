const http = require('http');
const socketio = require('socket.io');
const app = require('./app');
const Filter = require('bad-words');
const {
	generateMessage,
	generateLocationMessage,
} = require('./services/messages');
const {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
} = require('./services/users');
const {
	getRooms,
	addRoom,
	addUserToRoom,
	removeUserFromRoom,
	getRoomById,
} = require('./services/rooms');
const {addVote, getVoteByRoom, clearVotesByRoom} = require('./services/votes');
const {statsCount} = require('./utils');
const {
	CONNECTION,
	INIT_JOIN,
	JOIN,
	SEND_MESSAGE,
	SEND_LOCATION,
	SEND_VOTE,
	CLEAR_VOTE,
	SHOW_VOTES,
	DISCONNECT,
} = require('./constants');

const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 5000;

io.on(CONNECTION, socket => {
	console.log('New WebSocket connection');

	socket.on(INIT_JOIN, () => {
		socket.emit('sendRooms', getRooms());
	});

	socket.on(JOIN, (options, callback) => {
		let {error: roomError, room} = addRoom({roomName: options.roomName});
		if (roomError) {
			return callback(roomError);
		}

		let {error, user} = addUser({id: socket.id, roomId: room.id, ...options});

		if (error) {
			return callback(error);
		}
		addUserToRoom(room.id, user); //TODO: use return

		socket.join(user.roomId);

		socket.emit('message', generateMessage('Admin', 'Welcome!'));
		socket.broadcast
			.to(user.roomId)
			.emit(
				'message',
				generateMessage('Admin', `${user.username} has joined!`),
			);
		io.to(user.roomId).emit('roomData', {
			room: getRoomById(user.roomId).name,
			users: getUsersInRoom(user.roomId),
		});
		io.to(user.roomId).emit('voteListUpdate', {
			voteData: getVoteByRoom(user),
			showVotes: false,
		});

		callback();
	});

	socket.on(SEND_MESSAGE, (message, callback) => {
		console.log('socket', socket.id);
		const user = getUser(socket.id);

		const filter = new Filter();

		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed!');
		}

		io.to(user.roomId).emit('message', generateMessage(user.username, message));
		callback();
	});

	socket.on(SEND_LOCATION, (coords, callback) => {
		const user = getUser(socket.id);
		io.to(user.roomId).emit(
			'locationMessage',
			generateLocationMessage(
				user.username,
				`https://google.com/maps?q=${coords.latitude},${coords.longitude}`,
			),
		);
		callback();
	});

	socket.on(SEND_VOTE, (points, callback) => {
		const user = getUser(socket.id);
		addVote(user, points);
		const voteData = getVoteByRoom(user);
		const currentRoom = getRoomById(user.roomId);
		const showVotes = voteData.length === currentRoom.users.length;
		const stats = showVotes
			? statsCount(voteData.map(item => item.vote))
			: null;

		io.to(user.roomId).emit('voteListUpdate', {voteData, showVotes, stats});
		callback();
	});

	socket.on(CLEAR_VOTE, (points, callback) => {
		const user = getUser(socket.id);
		clearVotesByRoom(user); //TODO use return

		io.to(user.roomId).emit('voteListUpdate', []);
		callback();
	});

	socket.on(SHOW_VOTES, (points, callback) => {
		const user = getUser(socket.id);

		const voteData = getVoteByRoom(user);
		const stats = statsCount(voteData.map(item => item.vote));

		io.to(user.roomId).emit('voteListUpdate', {
			voteData: getVoteByRoom(user),
			showVotes: true,
			stats,
		});
		callback();
	});

	socket.on(DISCONNECT, () => {
		const user = removeUser(socket.id);
		if (user) {
			removeUserFromRoom(user.roomId, user.id);
		}

		if (user) {
			io.to(user.roomId).emit(
				'message',
				generateMessage('Admin', `${user.username} has left!`),
			);
			io.to(user.roomId).emit('roomData', {
				room: getRoomById(user.roomId).name,
				users: getUsersInRoom(user.roomId),
			});
		}
	});
});

server.listen(port, () => {
	console.log(`Server is up on port ${port}!`);
});
