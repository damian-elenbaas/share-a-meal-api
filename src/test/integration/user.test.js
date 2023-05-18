var assert = require('assert');
const { expect } = require('chai');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../../app');
const pool = require('../../utils/mysql-db');

pool.getConnection((err, conn) => {
  if(err) {
    console.error(err);
    process.exit();
  }

  conn.query('DELETE FROM user', (sqlError, sqlResults) => {
    if(sqlError) {
      console.error(sqlError);
      process.exit();
    }

    conn.query(`INSERT INTO user VALUES 
          (1,'Mariëtte','van den Dullemen',1,'m.vandullemen@server.nl','secret','','','',''),
          (2,'John','Doe',1,'j.doe@server.com','secret','06 12425475','editor,guest','',''),
          (3,'Herman','Huizinga',1,'h.huizinga@server.nl','secret','06-12345678','editor,guest','',''),
          (4,'Marieke','Van Dam',0,'m.vandam@server.nl','secret','06-12345678','editor,guest','',''),
          (5,'Henk','Tank',1,'h.tank@server.com','secret','06 12425495','editor,guest','','');`,
      (sqlError, sqlResults) => {
        if(sqlError) {
          console.error(sqlError);
          process.exit();
        }
      }
    )
  });
});

chai.should();
chai.use(chaiHttp);

chai.use(require('chai-like'));
chai.use(require('chai-things'));

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
        'emailAddress': 'd.elenbaas@test.nl',
        'password': 'Abcd1234E',
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
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        assert(res.body.data.token);
        chai
          .request(server)
          .get('/api/user')
          .set('Authorization', 'Bearer ' + res.body.data.token)
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
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        chai
          .request(server)
          .get('/api/user/profile')
          .set('Authorization', 'Bearer ' + res.body.data.token)
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
});

describe('UC-204', function () {
  it('TC-204-2 - User id does not exist', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        chai
          .request(server)
          .get(`/api/user/0`)
          .set('Authorization', 'Bearer ' + res.body.data.token)
          .end((err, res) => {
            assert(err === null);
            res.body.should.be.an('object');
            res.body.should.has.property('status').to.be.equal(404);
            res.body.should.has.property('message').to.be.equal('User niet gevonden');
            res.body.should.has.property('data');
            done();
          })
      })
  })

  it('TC-204-3 - User id exists', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        chai
          .request(server)
          .get(`/api/user/2`)
          .set('Authorization', 'Bearer ' + res.body.data.token)
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

describe('UC-205', function () {
  it('TC-205-1 - Required field "emailAddress" not given', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        chai
          .request(server)
          .put(`/api/user/1`)
          .set('Authorization', 'Bearer ' + res.body.data.token)
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
          })
      })
  });

  it('TC-205-4 - User does not exist', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        chai
          .request(server)
          .put(`/api/user/42069`)
          .set('Authorization', 'Bearer ' + res.body.data.token)
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
            done();
          })
      })
  });

  it('TC-205-6 - User successfully updated', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        chai
          .request(server)
          .put(`/api/user/1`)
          .set('Authorization', 'Bearer ' + res.body.data.token)
          .send({
            'emailAddress': 'm.vandullemen@server.nl',
            'firstName': 'Damian'
          })
          .end((err, res) => {
            assert(err === null);
            res.body.should.be.an('object');
            res.body.should.has.property('status').to.be.equal(200);
            res.body.should.has.property('message');
            res.body.should.has.property('data');
            done();
          })
      })
  });
});

describe('UC-206', function () {
  it('TC-206-1 - User does not exist', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        'emailAddress': 'm.vandullemen@server.nl',
        'password': 'secret'
      })
      .end((err, res) => {
        chai.request(server)
          .delete('/api/user/0')
          .set('Authorization', 'Bearer ' + res.body.data.token)
          .end((err, res) => {
            assert(err === null);
            res.body.should.be.an('object');
            res.body.should.has.property('status').to.be.equal(404);
            res.body.should.has.property('message');
            res.body.should.has.property('data');
            done();
      })
    });
  });

  it('TC-206-4 - User is successfully deleted', (done) => {
    let emailAddress = 'f.test11231@example.com';
    let password = 'Abcaew123';
    let id, token;

    chai.request(server)
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
      .then(res => {
        res.body.should.has.property('status').to.be.equal(201);
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
        assert(res.body.data.token);
        token = 'Bearer ' + res.body.data.token;
        return chai.request(server)
          .get('/api/user')
          .set('Authorization', token);
      })
      .then(res => {
        res.body.should.has.property('status').to.be.equal(200);
        expect(res.body.data).to.be.an('array').that.contains.something.like({'id': id});
        return chai.request(server)
          .delete(`/api/user/${id}`)
          .set('Authorization', token);
      })
      .then(res => {
        res.body.should.has.property('status').to.be.equal(200);
        assert(res.body.message === `Gebruiker met ID ${id} is verwijderd`);
        return chai.request(server)
          .post('/api/login')
          .send({
            'emailAddress': 'm.vandullemen@server.nl',
            'password': 'secret'
          });
      })
      .then(res => {
        return chai.request(server)
          .get('/api/user')
          .set('Authorization', 'Bearer ' + res.body.data.token);
      })
      .then(res => {
        res.body.should.has.property('status').to.be.equal(200);
        expect(res.body.data).to.be.an('array').that.not.contains.something.like({'id': id});
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});

