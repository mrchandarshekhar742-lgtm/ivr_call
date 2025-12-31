// User Model - Currently using in-memory storage in server.js
// This file is kept for future database integration

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.password = data.password;
    this.phone = data.phone;
    this.role = data.role;
    this.status = data.status;
    this.permissions = data.permissions;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

module.exports = User;