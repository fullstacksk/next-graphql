const User = require('../../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../../config');
const { UserInputError } = require('apollo-server');
const { validateRegisterInput, validateLoginInput } = require('../../utils/validators');

function generateToken(user) {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			username: user.username
		},
		SECRET_KEY,
		{ expiresIn: '1h' }
	);
}
module.exports = {
	Mutation: {
		async login(_, { username, password }) {
			const { errors, valid } = validateLoginInput(username, password);

			if (!valid) {
				throw new UserInputError('Errors', { errors });
			}

			const user = await User.findOne({ username });

			if (!user) {
				errors.general = 'User not found';
				throw new UserInputError('User not found', { errors });
			}

			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				errors.general = 'Wrong crendetials';
				throw new UserInputError('Wrong crendetials', { errors });
			}

			const token = generateToken(user);

			return {
				...user._doc,
				id: user._id,
				token
			};
		},
		async register(parent, { registerInput: { username, email, password, confirmPassword } }, context, info) {
			//TODO: Validating regiserInput
			const { errors, valid } = validateRegisterInput(username, email, password, confirmPassword);
			if (!valid) {
				throw new UserInputError('Errors', { errors });
			}
			//TODO: make sure email doesn't exist already
			const userWithEmail = await User.findOne({ email });
			if (userWithEmail) {
				throw new UserInputError('Email is registered', { errors: { username: 'This email is registered' } });
			}
			//TODO: make sure user doesn't exist already
			const user = await User.findOne({ username });
			if (user) {
				throw new UserInputError('Username is taken', { errors: { username: 'This username is taken' } });
			}
			password = await bcrypt.hash(password, 12);
			const newUser = new User({
				username,
				email,
				password,
				createdAt: new Date().toISOString()
			});
			const res = await newUser.save();
			const token = generateToken(res);
			return {
				...res._doc,
				id: res._id,
				token
			};
		}
	}
};
