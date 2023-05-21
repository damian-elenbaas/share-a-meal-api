var assert = require('assert');
const { expect } = require('chai');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../../app');

chai.should();
chai.use(chaiHttp);

chai.use(require('chai-like'));
chai.use(require('chai-things'));

let emailAddress = 'd.elenbaas@test.nl';
let password = 'Abcd1234E';

describe('UC-402 - Remove participation on meal', function() {
  let token;
  let createdMealId;

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

        let userId = res.body.data.id;
        
        return chai
          .request(server)
          .get(`/api/meal?cookId=${userId}`);
      })
      .then((res) => {
        createdMealId = res.body.data[res.body.data.length - 1].id;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

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
  let token;
  let createdMealId;

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

        let userId = res.body.data.id;
        
        return chai
          .request(server)
          .get(`/api/meal?cookId=${userId}`);
      })
      .then((res) => {
        createdMealId = res.body.data[res.body.data.length - 1].id;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

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

  it('TC-305-4 - Meal deleted', (done) => {
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

