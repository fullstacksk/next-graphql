const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');

const typeDefs = require('./graphql/typedefs');
const resolvers = require('./graphql/resolvers');
const { MONGODB } = require('./config');

const server = new ApolloServer({
	typeDefs,
	resolvers
});

mongoose
	.connect(MONGODB, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	})
	.then(() => {
		console.log('MongoDB Connected');
		return server.listen({ port: 5000 });
	})
	.then((res) => {
		console.log(`Server is running on ${res.url}`);
	})
	.catch((e) => console.log(e));
