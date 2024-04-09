const mongoose = require("mongoose");

/**
 * Connect Database
 * @param {string} connectionStr
 * @returns {Promise<mongoose.Connection>}
 */
function connectDB(connectionStr) {
  return mongoose.connect(connectionStr, { serverSelectionTimeoutMS: 5000 });
}

module.exports = connectDB;
