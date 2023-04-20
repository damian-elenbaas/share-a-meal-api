var assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../app');

chai.should();
chai.use(chaiHttp);

describe('Server Info', function () {
  it('TC-102 - Server info should return succesful information', (done) => {
    chai
      .request(server)
      .get('/api/info')
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(200);
        res.body.should.has.property('message');
        res.body.should.has.property('data');
        let { data } = res.body;
        data.should.be.an('object');
        data.should.has.property('studentName').to.be.equal('Damian Elenbaas');
        data.should.has.property('studentNumber').to.be.equal(2198478);
        done();
      });
  });

  it('TC-103 - Server should return valid error when endpoint does not exist', (done) => {
    chai
      .request(server)
      .get('/api/doesnotexist')
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        res.body.should.has.property('status').to.be.equal(404);
        res.body.should.has.property('message').to.be.equal('Endpoint not found');
        res.body.should.has.property('data');
        done();
      })
  });
})
