const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");
const { expect } = chai;

const server = require("../../../server/app");

chai.use(chaiHttp);

let token;

describe("User route", () => {
  const signup = "/users/signup";
  const signin = "/users/signin";
  const secret = "/users/secret";
  const user = {
    email: faker.internet.email(),
    password: faker.internet.password()
  };
  const preSave = {
    email: "test@gmail.com",
    password: faker.internet.password()
  };

  before(done => {
    chai
      .request(server)
      .post(signup)
      .send(preSave)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        token = res.body.token;
        done();
      });
  });

  after("dropping test db", done => {
    mongoose.connection.dropDatabase(() => {
      console.log("database dropped");
    });
    mongoose.connection.close(() => {
      done();
    });
  });

  describe("signup", () => {
    it("should create new user if email not found", done => {
      chai
        .request(server)
        .post(signup)
        .send(user)
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).not.to.be.empty;
          expect(res.body).to.have.property("token");
          done();
        });
    });

    it("should return 403 if email was found", done => {
      chai
        .request(server)
        .post(signup)
        .send(preSave)
        .end((err, res) => {
          expect(res.status).to.equal(403);
          expect(res.body).to.be.deep.equal({
            error: "Email is already in use"
          });
          done();
        });
    });
  });

  describe("secret", () => {
    it("should return status 200", done => {
      chai
        .request(server)
        .get(secret)
        .set("Authorization", token)
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.be.deep.equal({
            secret: "resource"
          });
          done();
        });
    });
  });

  describe("signin", () => {
    it("should return error 400 if user email and passsword empty", done => {
      let user = {};
      chai
        .request(server)
        .post(signin)
        .send(user)
        .end((err, res) => {
          expect(res.status).to.be.equal(400);
          done();
        });
    });

    it("should return 200 and our token", done => {
      chai
        .request(server)
        .post(signin)
        .send(preSave)
        .end((err, res) => {
          expect(res.status).to.be.equal(200);
          expect(res.body).not.to.be.empty;
          expect(res.body).to.have.property("token");
          done();
        });
    });
  });
});
