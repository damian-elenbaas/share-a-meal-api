var assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../../app');

chai.should();
chai.use(chaiHttp);

chai.use(require('chai-like'));
chai.use(require('chai-things'));

let emailAddress = 'd.elenbaas@test.nl';
let password = 'Abcd1234E';
let createdMealId;

describe('UC-301', function() {
  let token;

  before(function(done) {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': emailAddress,
        'password': password
      })
      .then((res) => {
        token = res.body.data.token;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

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
  let token;

  before(function(done) {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': emailAddress,
        'password': password
      })
      .then((res) => {
        token = res.body.data.token;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

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
  let token;

  before(function(done) {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': emailAddress,
        'password': password
      })
      .then((res) => {
        token = res.body.data.token;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

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
  let token;

  before(function(done) {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': emailAddress,
        'password': password
      })
      .then((res) => {
        token = res.body.data.token;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

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
  let token;
  let createdUserId;

  before(function(done) {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': emailAddress,
        'password': password
      })
      .then((res) => {
        token = res.body.data.token;
        createdUserId = res.body.data.id;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

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
