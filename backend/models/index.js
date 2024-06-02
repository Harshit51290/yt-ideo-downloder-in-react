const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../database.sqlite')
});

// Define User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Sync models with the database
sequelize.sync();

// Function to check if a user exists by username
async function isUserRegistered(username) {
  try {
    // Query the User model to find a user with the given username
    const user = await User.findOne({ where: { username } });
    // If user is found, return true
    if (user) {
      return true;
    } else {
      // If user is not found, return false
      return false;
    }
  } catch (error) {
    // Handle any errors that occur during the query
    console.error('Error checking user registration:', error);
    throw error; // Optionally rethrow the error
  }
}

module.exports = {
  sequelize,
  User,
  isUserRegistered
};
