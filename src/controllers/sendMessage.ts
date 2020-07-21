import Filter from 'bad-words';
import { createUserService } from '../services/users.service';

import { User } from '../models/user';
import { generateMessage } from '../services/messages.service';

const userService = createUserService(User);

import { ControllerCallBackType } from '../types';
import { Server, Socket } from 'socket.io';

interface SendMessageControllerOptions {
	message: string;
}

export const createSendMessageController = (io: Server, socket: Socket) => {
	return async (
		options: SendMessageControllerOptions,
		callback: ControllerCallBackType,
	): Promise<void> => {
		const { error, users = [] } = await userService.getUsers({
			// TODO: Use getUser
			socketId: socket.id,
		});
		const user = users[0];

		if (error) {
			return callback(error);
		}

		const filter = new Filter();

		if (filter.isProfane(options)) {
			return callback('Profanity is not allowed!');
		}

		io.to(String(user.roomId)).emit(
			'message',
			generateMessage(user.name || 'unknown', options.message),
		);
		callback();
	};
};