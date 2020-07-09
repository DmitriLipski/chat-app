const { User } = require('../models/user');
const { createUserService } = require('../services/users.service');

const userService = createUserService(User);

const createClearVoteController = (io, socket) => {
	return async (points, callback) => {
		const { error, user } = await userService.getUser({ socketId: socket.id });
		if (error) {
			return callback(error);
		}
		const { error: clearVotesError } = await userService.clearVotesByRoom(
			user.roomId,
		);
		if (clearVotesError) {
			return callback(clearVotesError);
		}
		io.to(user.roomId).emit('voteListUpdate', {
			voteData: [],
		});
		callback();
	};
};

module.exports = {
	createClearVoteController,
};
