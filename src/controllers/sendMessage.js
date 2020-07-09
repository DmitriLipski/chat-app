const Filter = require('bad-words');
const { createUserService } = require('../services/users.service');

const { User } = require('../models/user');
const userService = createUserService(User);
const { generateMessage } = require('../services/messages');

const createSendMessageController = (io, socket) => {
	return async (message, callback) => {
		const { error, users } = await userService.getUsers({
			// TODO: Use getUser
			socketId: socket.id,
		});
		const user = users[0];

		if (error) {
			return callback(error);
		}

		const filter = new Filter();

		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed!');
		}

		io.to(user.roomId).emit('message', generateMessage(user.name, message));
		callback();
	};
};

module.exports = {
	createSendMessageController,
};
