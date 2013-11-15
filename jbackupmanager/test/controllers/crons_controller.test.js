var app, compound
, request = require('supertest')
, sinon   = require('sinon');

function CronStub () {
    return {
        
    };
}

describe('CronController', function() {
    beforeEach(function(done) {
        app = getApp();
        compound = app.compound;
        compound.on('ready', function() {
            done();
        });
    });

    /*
     * GET /crons/new
     * Should render crons/new.ejs
     */
    it('should render "new" template on GET /crons/new', function (done) {
        request(app)
        .get('/crons/new')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.didRender(/crons\/new\.ejs$/i).should.be.true;
            done();
        });
    });

    /*
     * GET /crons
     * Should render crons/index.ejs
     */
    it('should render "index" template on GET /crons', function (done) {
        request(app)
        .get('/crons')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.didRender(/crons\/index\.ejs$/i).should.be.true;
            done();
        });
    });

    /*
     * GET /crons/:id/edit
     * Should access Cron#find and render crons/edit.ejs
     */
    it('should access Cron#find and render "edit" template on GET /crons/:id/edit', function (done) {
        var Cron = app.models.Cron;

        // Mock Cron#find
        Cron.find = sinon.spy(function (id, callback) {
            callback(null, new Cron);
        });

        request(app)
        .get('/crons/42/edit')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Cron.find.calledWith('42').should.be.true;
            app.didRender(/crons\/edit\.ejs$/i).should.be.true;

            done();
        });
    });

    /*
     * GET /crons/:id
     * Should render crons/index.ejs
     */
    it('should access Cron#find and render "show" template on GET /crons/:id', function (done) {
        var Cron = app.models.Cron;

        // Mock Cron#find
        Cron.find = sinon.spy(function (id, callback) {
            callback(null, new Cron);
        });

        request(app)
        .get('/crons/42')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Cron.find.calledWith('42').should.be.true;
            app.didRender(/crons\/show\.ejs$/i).should.be.true;

            done();
        });
    });

    /*
     * POST /crons
     * Should access Cron#create when Cron is valid
     */
    it('should access Cron#create on POST /crons with a valid Cron', function (done) {
        var Cron = app.models.Cron
        , cron = new CronStub;

        // Mock Cron#create
        Cron.create = sinon.spy(function (data, callback) {
            callback(null, cron);
        });

        request(app)
        .post('/crons')
        .send({ "Cron": cron })
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            Cron.create.calledWith(cron).should.be.true;

            done();
        });
    });

    /*
     * POST /crons
     * Should fail when Cron is invalid
     */
    it('should fail on POST /crons when Cron#create returns an error', function (done) {
        var Cron = app.models.Cron
        , cron = new CronStub;

        // Mock Cron#create
        Cron.create = sinon.spy(function (data, callback) {
            callback(new Error, cron);
        });

        request(app)
        .post('/crons')
        .send({ "Cron": cron })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Cron.create.calledWith(cron).should.be.true;

            app.didFlash('error').should.be.true;

            done();
        });
    });

    /*
     * PUT /crons/:id
     * Should redirect back to /crons when Cron is valid
     */
    it('should redirect on PUT /crons/:id with a valid Cron', function (done) {
        var Cron = app.models.Cron
        , cron = new CronStub;

        Cron.find = sinon.spy(function (id, callback) {
            callback(null, {
                id: 1,
                updateAttributes: function (data, cb) { cb(null) }
            });
        });

        request(app)
        .put('/crons/1')
        .send({ "Cron": cron })
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            res.header['location'].should.include('/crons/1');

            app.didFlash('error').should.be.false;

            done();
        });
    });

    /*
     * PUT /crons/:id
     * Should not redirect when Cron is invalid
     */
    it('should fail / not redirect on PUT /crons/:id with an invalid Cron', function (done) {
        var Cron = app.models.Cron
        , cron = new CronStub;

        Cron.find = sinon.spy(function (id, callback) {
            callback(null, {
                id: 1,
                updateAttributes: function (data, cb) { cb(new Error) }
            });
        });

        request(app)
        .put('/crons/1')
        .send({ "Cron": cron })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.didFlash('error').should.be.true;

            done();
        });
    });

    /*
     * DELETE /crons/:id
     * -- TODO: IMPLEMENT --
     */
    it('should delete a Cron on DELETE /crons/:id');

    /*
     * DELETE /crons/:id
     * -- TODO: IMPLEMENT FAILURE --
     */
    it('should not delete a Cron on DELETE /crons/:id if it fails');
});
