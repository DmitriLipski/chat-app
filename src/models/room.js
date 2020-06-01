const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
	name: { type: String, default: 'default' },
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;