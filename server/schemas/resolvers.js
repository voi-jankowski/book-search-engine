const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
  Query: {
    // get a single user by either their id or their username
    me: async (parent, args, { user }) => {
      if (!user) {
        throw new AuthenticationError("You need to be logged in!");
      }
      const foundUser = await User.findById(user._id);
      if (!foundUser) {
        throw new AuthenticationError("Cannot find a user with this id!");
      }
      return foundUser;
    },
  },
  Mutation: {
    // create a new user
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      if (!user) {
        throw new AuthenticationError("Something is wrong!");
      }
      const token = signToken(user);
      return { token, user };
    },
    // login a user
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Can't find this user");
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError("Wrong password!");
      }
      const token = signToken(user);
      return { token, user };
    },
    // save a book to a user's `savedBooks`
    saveBook: async (parent, { bookId }, { user }) => {
      if (!user) {
        throw new AuthenticationError("You need to be logged in!");
      }
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: bookId } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      } catch (err) {
        console.log(err);
        return err;
      }
    },
    // remove a book from `savedBooks`
    removeBook: async (parent, { bookId }, { user }) => {
      if (!user) {
        throw new AuthenticationError("You need to be logged in!");
      }
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $pull: { savedBooks: bookId } },
          { new: true }
        );
        return updatedUser;
      } catch (err) {
        console.log(err);
        return err;
      }
    },
  },
};

module.exports = resolvers;
