var assert = require('assert');
const { expect } = require('chai');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../../app');
const pool = require('../../utils/mysql-db');

chai.should();
chai.use(chaiHttp);

chai.use(require('chai-like'));
chai.use(require('chai-things'));

let emailAddress = 'd.elenbaas@test.nl';
let password = 'Abcd1234E';
let createdUserId;
let token;
let createdMealId;

describe('UC-201', function () {
  it('TC-201-1 - Required field is missing', (done) => {
    chai
      .request(server)
      .post('/api/user')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        // 'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'f.test@example.com',
        'password': 'Abcdefg13',
        'phoneNumber': '06 12345678'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(400);
        res.body.should.has.property('message')

        let { message } = res.body;
        message.should.be.an('string');

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
      .post('/api/user')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'testexample.com',
        'password': '123',
        'phoneNumber': '0612345235'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(400);
        res.body.should.has.property('message')
          .to.be.equal('Invalid email address');
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
      .post('/api/user')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'f.test@example.com',
        'password': '',
        'phoneNumber': '0612345678'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(400);
        res.body.should.has.property('message')
        
        let { message } = res.body;
        message.should.be.an('string');

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
      .post('/api/user')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'Abcdefg123',
        'phoneNumber': '06 12345678'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(403);
        res.body.should.has.property('message')
          .to.be.equal('Er bestaat al een user met opgegeven email adres');
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
      .post('/api/user')
      .send({
        'firstName': 'Damian',
        'lastName': 'Elenbaas',
        'street': 'Lovensdijkstraat 61',
        'city': 'Breda',
        'isActive': true,
        'emailAddress': emailAddress,
        'password': password,
        'phoneNumber': '0612345678'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(201);
        res.body.should.has.property('message')
          .to.be.equal('User succesvol geregistreerd');
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

        createdUserId = data.id;
        done();
      })
  });
});

describe('UC-101', function() {
  it('TC-101-1 - Required field is missing', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        // 'emailAddress': 'm.vandullemen@server.nl',
        'password': 'Secret123'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(400);
        res.body.should.has.property('message')
        res.body.should.has.property('data').to.be.empty;

        done();
      });
  });

  it('TC-101-2 - Not valid password', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(400);
        res.body.should.has.property('message')
        res.body.should.has.property('data').to.be.empty;

        done();
      });
  });

  it('TC-101-3 - User does not exist', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'doesNotExist@server.nl',
        'password': 'Secret123'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(404);
        res.body.should.has.property('message')
        res.body.should.has.property('data').to.be.empty;

        done();
      });
  });

  it('TC-101-4 - Successfully logged in', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': emailAddress,
        'password': password 
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status')
          .to.be.equal(200);
        res.body.should.has.property('message')
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
        data.should.not.has.property('password');
        data.should.has.property('phoneNumber');
        data.should.has.property('token');

        token = data.token;

        done();
      });
  });
});

describe('UC-202', function () {
  it('TC-202-1 - Show all users', (done) => {
    chai
      .request(server)
      .get('/api/user')
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('array');
        data.forEach((user) => {
          user.should.has.property('id');
          user.should.has.property('firstName');
          user.should.has.property('lastName');
          user.should.has.property('street');
          user.should.has.property('city');
          user.should.has.property('isActive');
          user.should.has.property('emailAddress');
          user.should.has.property('phoneNumber');
          user.should.not.has.property('password');
          user.should.not.has.property('token');
        });


        done();
      });
  });

  it('TC-202-2 - Show users with searchterms that dont exist', (done) => {
    chai
      .request(server)
      .get('/api/user?fwefwName=test&lastName=test')
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('array').to.be.empty;

        done();
      });
  });

  it('TC-202-3 - Show users with usage of field isActive=false', (done) => {
    chai
      .request(server)
      .get('/api/user?isActive=false')
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('array');
        data.forEach((user) => {
          user.should.has.property('id');
          user.should.has.property('firstName');
          user.should.has.property('lastName');
          user.should.has.property('street');
          user.should.has.property('city');
          user.should.has.property('isActive').to.be.equal(false);
          user.should.has.property('emailAddress');
          user.should.has.property('phoneNumber');
          user.should.not.has.property('password');
          user.should.not.has.property('token');
        });

        done();
      });
  });

  it('TC-202-4 - Show users with usage of field isActive=true', (done) => {
    chai
      .request(server)
      .get('/api/user?isActive=true')
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('array');
        data.forEach((user) => {
          user.should.has.property('id');
          user.should.has.property('firstName');
          user.should.has.property('lastName');
          user.should.has.property('street');
          user.should.has.property('city');
          user.should.has.property('isActive').to.be.equal(true);
          user.should.has.property('emailAddress');
          user.should.has.property('phoneNumber');
          user.should.not.has.property('password');
          user.should.not.has.property('token');
        });

        done();
      });
  });

  it('TC-202-5 - Show users with searchterms on existing fields', (done) => {
    chai
      .request(server)
      .get('/api/user?firstName=Damian&isActive=true')
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('array');
        data.forEach((user) => {
          user.should.has.property('id');
          user.should.has.property('firstName').to.be.equal('Damian');
          user.should.has.property('lastName');
          user.should.has.property('street');
          user.should.has.property('city');
          user.should.has.property('isActive').to.be.equal(true);
          user.should.has.property('emailAddress');
          user.should.has.property('phoneNumber');
          user.should.not.has.property('password');
          user.should.not.has.property('token');
        });

        done();
      });
  });

});

describe('UC-203', function () {
  it('TC-203-1 - Invalid token', (done) => {
    chai
      .request(server)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer NotAValidToken')
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-203-2 - User is logged in with valid token', (done) => {
    chai
      .request(server)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer ' + token)
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
        data.should.has.property('phoneNumber');

        done();
      });
  });
});

describe('UC-204', function () {

  it('TC-204-1 - Invalid token', (done) => {
  chai
      .request(server)
      .get(`/api/user/2`)
      .set('Authorization', 'Bearer NotAValidToken')
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-204-2 - User id does not exist', (done) => {
    chai
      .request(server)
      .get(`/api/user/0`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message').to.be.equal('User niet gevonden');
        res.body.should.has.property('data');
        done();
      });
  });

  it('TC-204-3 - User id exists', (done) => {
    chai
      .request(server)
      .get(`/api/user/2`)
      .set('Authorization', 'Bearer ' + token)
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
        data.should.has.property('phoneNumber');
        data.should.not.has.property('password');
        data.should.not.has.property('token');

        done();
      });
  });
});

describe('UC-205', function () {
  it('TC-205-1 - Required field "emailAddress" not given', (done) => {
    chai
      .request(server)
      .put(`/api/user/${createdUserId}`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'firstName': 'Damian'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(400);
        res.body.should.has.property('message');
        res.body.should.has.property('data');
        done();
      });
  });

  it('TC-205-2 - User is not the owner of the data', (done) => {
    chai
      .request(server)
      .put(`/api/user/1`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'emailAddress': emailAddress,
        'firstName': 'Damian'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(403);
        res.body.should.has.property('message');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-205-3 - Invalid phone number', (done) => {
    chai
      .request(server)
      .put(`/api/user/${createdUserId}`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'emailAddress': emailAddress,
        'phoneNumber': '124124124124'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(400);
        res.body.should.has.property('message');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-205-4 - User does not exist', (done) => {
    chai
      .request(server)
      .put(`/api/user/42069`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'emailAddress': 'm.vandullemen@server.nl',
        'firstName': 'Damian'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-205-5 - User is not logged in', (done) => {
    chai
      .request(server)
      .put(`/api/user/${createdUserId}`)
      // .set('Authorization', 'Bearer ' + token)
      .send({
        'emailAddress': emailAddress,
        'firstName': 'Test'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');
        let { data } = res.body;
        data.should.be.an('object').to.be.empty;
        done();
      });
  });

  it('TC-205-6 - User successfully updated', (done) => {
    chai
      .request(server)
      .put(`/api/user/${createdUserId}`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'emailAddress': emailAddress,
        'firstName': 'Test'
      })
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
        data.should.has.property('phoneNumber');
        data.should.not.has.property('password');
        data.should.not.has.property('token');

        done();
      });
  });
});

describe('UC-301', function() {
  it('TC-301-1 - Required field is missing', (done) => {
    chai
      .request(server)
      .post('/api/meal')
      .set('Authorization', 'Bearer ' + token)
      .send({
        'name': 'Een test maaltijd',
        'description': 'Een test maaltijd beschrijving',
        'price': 2.00,
        'maxAmountOfParticipants': 3
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(400);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-301-2 - Not logged in', (done) => {
    chai
      .request(server)
      .post('/api/meal')
      // .set('Authorization', 'Bearer ' + token)
      .send({
        'name': 'Een test maaltijd',
        'description': 'Een test maaltijd beschrijving',
        'price': 2.00,
        'maxAmountOfParticipants': 3,
        'imageUrl': 'http://test.nl/bestand.jpg'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-301-3 - Meal successfully added', (done) => {
    chai
      .request(server)
      .post('/api/meal')
      .set('Authorization', 'Bearer ' + token)
      .send({
        'name': 'Een test maaltijd',
        'description': 'Een test maaltijd beschrijving',
        'price': 2.00,
        'maxAmountOfParticipants': 3,
        'imageUrl': 'http://test.nl/bestand.jpg'
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(201);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').not.to.be.empty;

        data.should.has.property('id');
        data.should.has.property('name');
        data.should.has.property('description');
        data.should.has.property('isActive');
        data.should.has.property('isVega');
        data.should.has.property('isVegan');
        data.should.has.property('isToTakeHome');
        data.should.has.property('dateTime');
        data.should.has.property('maxAmountOfParticipants');
        data.should.has.property('price');
        data.should.has.property('imageUrl');
        data.should.has.property('allergenes');
        // data.should.has.property('cook').to.be.an('object');

        // let { cook } = data;
        //
        // cook.should.has.property('id');
        // cook.should.has.property('firstName');
        // cook.should.has.property('lastName');
        // cook.should.has.property('street');
        // cook.should.has.property('city');
        // cook.should.has.property('isActive');
        // cook.should.has.property('emailAddress');
        // cook.should.has.property('phoneNumber');
        // cook.should.not.has.property('password');
        // cook.should.not.has.property('token');
        //
        createdMealId = data.id;

        done();
      });
  });
});

describe('UC-302', function() {
  it('TC-302-1 - Required field "name", "price" and/or "maxAmountOfParticipants" is missing', (done) => {
    chai
      .request(server)
      .put(`/api/meal/${createdMealId}`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'name': 'Een test maaltijd',
        'maxAmountOfParticipants': 3,
        // 'price': 3.00
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(400);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-302-2 - Not logged in', (done) => {
    chai
      .request(server)
      .put(`/api/meal/${createdMealId}`)
      // .set('Authorization', 'Bearer ' + token)
      .send({
        'name': 'Een test maaltijd',
        'maxAmountOfParticipants': 3,
        'price': 3.00
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-302-3 - Not the owner of the meal', (done) => {
    chai
      .request(server)
      .put(`/api/meal/1`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'name': 'Een test maaltijd',
        'maxAmountOfParticipants': 3,
        'price': 3.00
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(403);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-302-4 - Meal does not exist', (done) => {
    chai
      .request(server)
      .put(`/api/meal/0`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'name': 'Een test maaltijd',
        'maxAmountOfParticipants': 3,
        'price': 3.00
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-302-5 - Meal successfully updated', (done) => {
    chai
      .request(server)
      .put(`/api/meal/${createdMealId}`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        'name': 'Een test maaltijd',
        'maxAmountOfParticipants': 1,
        'price': 3.00
      })
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').not.to.be.empty;

        data.should.has.property('id');
        data.should.has.property('name');
        data.should.has.property('description');
        data.should.has.property('isActive');
        data.should.has.property('isVega');
        data.should.has.property('isVegan');
        data.should.has.property('isToTakeHome');
        data.should.has.property('dateTime');
        data.should.has.property('maxAmountOfParticipants');
        data.should.has.property('price');
        data.should.has.property('imageUrl');
        data.should.has.property('allergenes');

        done();
      });
  });

});

describe('UC-303 - Get all meals', function() {
  it('TC-303-1 - List of meals returned', (done) => {
    chai
      .request(server)
      .get('/api/meal')
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('array');

        data.forEach((meal) => {
          meal.should.has.property('id');
          meal.should.has.property('name');
          meal.should.has.property('description');
          meal.should.has.property('isActive');
          meal.should.has.property('isVega');
          meal.should.has.property('isVegan');
          meal.should.has.property('isToTakeHome');
          meal.should.has.property('dateTime');
          meal.should.has.property('maxAmountOfParticipants');
          meal.should.has.property('price');
          meal.should.has.property('imageUrl');
          meal.should.has.property('allergenes');
        });
        done();
      });
  });
});

describe('UC-304 - Get meal by ID', function() {
  it('TC-304-1 - Meal does not exist', (done) => {
    chai
      .request(server)
      .get(`/api/meal/0`)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-304-2 - Meal details received', (done) => {
    chai
      .request(server)
      .get(`/api/meal/${createdMealId}`)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').not.to.be.empty;

        data.should.has.property('id');
        data.should.has.property('name');
        data.should.has.property('description');
        data.should.has.property('isActive');
        data.should.has.property('isVega');
        data.should.has.property('isVegan');
        data.should.has.property('isToTakeHome');
        data.should.has.property('dateTime');
        data.should.has.property('maxAmountOfParticipants');
        data.should.has.property('price');
        data.should.has.property('imageUrl');
        data.should.has.property('allergenes');

        done();
      });
  });
});

describe('UC-401 - Participate on meal', function() {
  it('TC-401-1 Not logged in', (done) => {
    chai
      .request(server)
      .post(`/api/meal/${createdMealId}/participate`)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-401-2 Meal does not exist', (done) => {
    chai
      .request(server)
      .post(`/api/meal/0/participate`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-401-3 Successfully participated', (done) => {
    chai
      .request(server)
      .post(`/api/meal/${createdMealId}/participate`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').not.to.be.empty;

        done();
      });
  });

  it('TC-401-4 Maximum participants reached', (done) => {
    chai
      .request(server)
      .post(`/api/meal/${createdMealId}/participate`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message')
          .to.be.equal('Maximum aantal aanmeldingen is bereikt');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });
});

describe('UC-403', function() {
  it('TC-403-1 - Get all participants of meal', (done) => {
    chai
      .request(server)
      .get(`/api/meal/${createdMealId}/participants`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object');
        data.should.has.property('participants');
        data.participants.forEach((participantId) => {
          participantId.should.be.an('number'); 
        });

        done();
      });
  });
});

describe('UC-404', function() {
  it('TC-404-1 - Get details of participant', (done) => {
    chai
      .request(server)
      .get(`/api/meal/${createdMealId}/participants/${createdUserId}`)
      .set('Authorization', 'Bearer ' + token)
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
        data.should.has.property('phoneNumber');
        data.should.not.has.property('password');
        data.should.not.has.property('token');

        done();
      });
  });
});

describe('UC-402 - Remove participation on meal', function() {
  it('TC-402-1 Not logged in', (done) => {
    chai
      .request(server)
      .delete(`/api/meal/${createdMealId}/participate`)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-402-2 Meal does not exist', (done) => {
    chai
      .request(server)
      .delete(`/api/meal/0/participate`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-402-3 Participation does not exist', (done) => {
    chai
      .request(server)
      .delete(`/api/meal/1/participate`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-402-4 Successfully removed participation', (done) => {
    chai
      .request(server)
      .delete(`/api/meal/${createdMealId}/participate`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').not.to.be.empty;

        done();
      });
  });
});

describe('UC-305', function() {
  it('TC-305-1 - Not logged in', (done) => {
    chai
      .request(server)
      .delete(`/api/meal/${createdMealId}`)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-305-2 - Not the owner of the data', (done) => {
    chai
      .request(server)
      .delete(`/api/meal/1`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(403);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-305-3 - Meal does not exist', (done) => {
    chai
      .request(server)
      .delete(`/api/meal/0`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-305-4 - Meal does not exist', (done) => {
    chai
      .request(server)
      .delete(`/api/meal/${createdMealId}`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });
});

describe('UC-206', function () {
  it('TC-206-1 - User does not exist', (done) => {
    chai.request(server)
      .delete('/api/user/0')
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      })
  });

  it('TC-206-2 - User is not logged in', (done) => {
    chai.request(server)
      .delete(`/api/user/${createdUserId}`)
      .set('Authorization', 'Bearer NotAValidToken')
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(401);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-206-3 - User is not the owner of the data', (done) => {
    chai.request(server)
      .delete(`/api/user/1`)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(403);
        res.body.should.has.property('message');
        res.body.should.has.property('data');

        let { data } = res.body;
        data.should.be.an('object').to.be.empty;

        done();
      });
  });

  it('TC-206-4 - User is successfully deleted', (done) => {
    chai
      .request(server)
      .get('/api/user')
      .set('Authorization', 'Bearer ' + token)
      .then(res => {
        res.body.should.has.property('status').to.be.equal(200);
        expect(res.body.data).to.be.an('array').that.contains.something.like({'id': createdUserId});
        return chai.request(server)
          .delete(`/api/user/${createdUserId}`)
          .set('Authorization', 'Bearer ' + token)
      })
      .then(res => {
        res.body.should.has.property('status').to.be.equal(200);
        assert(res.body.message === `Gebruiker met ID ${createdUserId} is verwijderd`);
        return chai.request(server)
          .post('/api/login')
          .send({
            'emailAddress': 'm.vandullemen@server.nl',
            'password': 'Secret12'
          });
      })
      .then(res => {
        return chai.request(server)
          .get('/api/user')
          .set('Authorization', 'Bearer ' + res.body.data.token);
      })
      .then(res => {
        res.body.should.has.property('status').to.be.equal(200);
        expect(res.body.data).to.be.an('array').that.not.contains.something.like({'id': createdUserId});
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});

