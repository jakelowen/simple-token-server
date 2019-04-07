import { GraphQLServer } from "graphql-yoga";
import cors from "cors";
import jwt from "express-jwt";
import jsonwebtoken from "jsonwebtoken";

require("dotenv").config();

const typeDefs = `
  type User {
    id: String!
  }
  
  type Query {
    me: User
  }

  type Mutation {
    login(id: String!): String!
  }
`;

const resolvers = {
  Query: {
    me: (_, __, ctx) => {
      if (ctx.user && ctx.user.id) {
        return {
          id: ctx.user.id
        };
      }
      return null;
    }
  },
  Mutation: {
    login: (_, { id }, ctx) => {
      return jsonwebtoken.sign({ id }, process.env.TOKEN_SECRET, {
        expiresIn: "1y"
      });
    }
  }
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: ({ request, response }) => ({
    req: request,
    res: response,
    user: request.user,
    redis
  })
});

// auth middleware
const auth = jwt({
  secret: process.env.TOKEN_SECRET,
  credentialsRequired: false
});

server.express.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_HOST
  })
);

server.express.use(auth);

if (process.env.ENABLE_TRUST_PROXY) {
  console.log("TRUST PROXY ENABLED!");
  server.express.set("trust proxy", 1); // trust first proxy
  // sessionOptions.cookie.secure = true; // serve secure cookies
}

const options = {
  endpoint: "/graphql",
  subscriptions: "/subscriptions",
  playground: "/playground",
  cors: false
};

server.start(options, ({ port }) =>
  console.log(
    `Server started, listening on port ${port} for incoming requests.`
  )
);
