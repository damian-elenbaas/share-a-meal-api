var assert = require('assert');
const { expect } = require('chai');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../app');

chai.should();
chai.use(chaiHttp);

chai.use(require('chai-like'));
chai.use(require('chai-things'));

describe('UC-201', function () {
  it('TC-201-1 - Required field is missing', (done) => {
    chai
      .request(server)
      .post('/api/register')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        // 'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'test@example.com',
        'password': '123',
        'phoneNumber': '+31123456789'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(400);
        res.body.should.has.property('message')
          .to.be.equal('Bad request. Not all required properties are specified');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object')
            .to.be.empty;

        done();
      })
  });

  it('TC-201-2 - Not a valid email address', function (done) {
    chai
      .request(server)
      .post('/api/register')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'testexample.com',
        'password': '123',
        'phoneNumber': '+31123456789'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(400);
        res.body.should.has.property('message')
          .to.be.equal('Bad request. Invalid email address');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object')
            .to.be.empty;

        done();
      })
  });

  it('TC-201-3 - Not a valid password', function (done) {
    chai
      .request(server)
      .post('/api/register')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'test@example.com',
        'password': '',
        'phoneNumber': '+31123456789'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(400);
        res.body.should.has.property('message')
          .to.be.equal('Bad request. Invalid password');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object')
            .to.be.empty;

        done();
      })
  });

  it('TC-201-4 - User already exists', function (done) {
    chai
      .request(server)
      .post('/api/register')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'd.elenbaas1@student.avans.nl',
        'password': '123',
        'phoneNumber': '+31123456789'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(403);
        res.body.should.has.property('message')
          .to.be.equal('User with specified email address already exists');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object')
            .to.be.empty;

        done();
      })
  });

  it('TC-201-5 - User successfuly registered', function (done) {
    chai
      .request(server)
      .post('/api/register')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'test@example.com',
        'password': '123',
        'phoneNumber': '+31123456789'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(201);
        res.body.should.has.property('message')
          .to.be.equal('User succesfully registered');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object');
        data.should.has.property('id');
        data.should.has.property('firstName');
        data.should.has.property('lastName');
        data.should.has.property('street');
        data.should.has.property('city');
        data.should.has.property('isActive');
        data.should.has.property('emailAddress');
        data.should.has.property('password');
        data.should.has.property('phoneNumber');

        done();
      })
  });
});


describe('UC-202', function () {
  it('TC-202-1 - Show all users', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'd.elenbaas1@student.avans.nl',
        'password': 'abc123'
      })
      .end((err, res) => {
        chai
          .request(server)
          .get('/api/user')
          .set('Authorization', res.body.data.token)
          .end((err, res) => {
            assert(err === null);
            res.body.should.be.an('object');
            res.body.should.has.property('status').to.be.equal(200);
            res.body.should.has.property('message');
            res.body.should.has.property('data');
            let { data } = res.body;
            data.should.be.an('array');

            done();
          })
      })

  });
});

describe('UC-203', function () {
  it('TC-203-2 - User is logged in with valid token', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'd.elenbaas1@student.avans.nl',
        'password': 'abc123'
      })
      .end((err, res) => {
        chai
          .request(server)
          .get('/api/user/profile')
          .set('Authorization', res.body.data.token)
          .end((err, res) => {
            assert(err === null);
            res.body.should.be.an('object');
            res.body.should.has.property('status').to.be.equal(200);
            res.body.should.has.property('message');
            res.body.should.has.property('data');
            let { data } = res.body;
            data.should.be.an('object');
            data.should.has.property('id');
            data.should.has.property('firstName');
            data.should.has.property('lastName');
            data.should.has.property('street');
            data.should.has.property('city');
            data.should.has.property('isActive');
            data.should.has.property('emailAddress');
            data.should.has.property('password');
            data.should.has.property('phoneNumber');

            done();
          })
      })

  });
});

describe('UC-204', function () {
  it('TC-204-3 - User id exists', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'd.elenbaas1@student.avans.nl',
        'password': 'abc123'
      })
      .end((err, res) => {
        chai
          .request(server)
          .get(`/api/user/2`)
          .set('Authorization', res.body.data.token)
          .end((err, res) => {
            assert(err === null);
            res.body.should.be.an('object');
            res.body.should.has.property('status').to.be.equal(200);
            res.body.should.has.property('message');
            res.body.should.has.property('data');
            let { data } = res.body;
            data.should.be.an('object');
            data.should.has.property('id');
            data.should.has.property('firstName');
            data.should.has.property('lastName');
            data.should.has.property('street');
            data.should.has.property('city');
            data.should.has.property('isActive');
            data.should.has.property('emailAddress');
            // data.should.has.property('password');
            data.should.has.property('phoneNumber');

            done();
          })
      })

  });
});

describe('UC-206', function () {
  it('TC-206-4 - User is successfully deleted', (done) => {
    let emailAddress = 'test2@example.com';
    let password = '123';
    let id, token;

    chai.request(server)
      .post('/api/register')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': emailAddress,
        'password': password,
        'phoneNumber': '+31123456789'
      })
      .then(res => {
        assert(res.body.status === 201);
        assert(res.body.data.id);
        id = res.body.data.id;
        return chai.request(server)
          .post('/api/login')
          .send({
            'emailAddress': emailAddress,
            'password': password
          });
      })
      .then(res => {
        token = res.body.data.token;
        return chai.request(server)
          .get('/api/user')
          .set('Authorization', token);
      })
      .then(res => {
        assert(res.body.status === 200);
        expect(res.body.data).to.be.an('array').that.contains.something.like({'id': id});
        return chai.request(server)
          .delete(`/api/user/${id}`)
          .set('Authorization', token);
      })
      .then(res => {
        assert(res.body.status === 200);
        return chai.request(server)
          .post('/api/login')
          .send({
            'emailAddress': 'd.elenbaas1@student.avans.nl',
            'password': 'abc123'
          });
      })
      .then(res => {
        return chai.request(server)
          .get('/api/user')
          .set('Authorization', res.body.data.token);
      })
      .then(res => {
        assert(res.body.status === 200);
        expect(res.body.data).to.be.an('array').that.not.contains.something.like({'id': id});
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});

