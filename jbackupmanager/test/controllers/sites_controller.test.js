var app, compound
, request = require('supertest')
, sinon   = require('sinon');

function SiteStub () {
    return {
        name: ''
    };
}

describe('SiteController', function() {
    beforeEach(function(done) {
        app = getApp();
        compound = app.compound;
        compound.on('ready', function() {
            done();
        });
    });

    /*
     * GET /sites/new
     * Should render sites/new.ejs
     */
    it('should render "new" template on GET /sites/new', function (done) {
        request(app)
        .get('/sites/new')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.didRender(/sites\/new\.ejs$/i).should.be.true;
            done();
        });
    });

    /*
     * GET /sites
     * Should render sites/index.ejs
     */
    it('should render "index" template on GET /sites', function (done) {
        request(app)
        .get('/sites')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.didRender(/sites\/index\.ejs$/i).should.be.true;
            done();
        });
    });

    /*
     * GET /sites/:id/edit
     * Should access Site#find and render sites/edit.ejs
     */
    it('should access Site#find and render "edit" template on GET /sites/:id/edit', function (done) {
        var Site = app.models.Site;

        // Mock Site#find
        Site.find = sinon.spy(function (id, callback) {
            callback(null, new Site);
        });

        request(app)
        .get('/sites/42/edit')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Site.find.calledWith('42').should.be.true;
            app.didRender(/sites\/edit\.ejs$/i).should.be.true;

            done();
        });
    });

    /*
     * GET /sites/:id
     * Should render sites/index.ejs
     */
    it('should access Site#find and render "show" template on GET /sites/:id', function (done) {
        var Site = app.models.Site;

        // Mock Site#find
        Site.find = sinon.spy(function (id, callback) {
            callback(null, new Site);
        });

        request(app)
        .get('/sites/42')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Site.find.calledWith('42').should.be.true;
            app.didRender(/sites\/show\.ejs$/i).should.be.true;

            done();
        });
    });

    /*
     * POST /sites
     * Should access Site#create when Site is valid
     */
    it('should access Site#create on POST /sites with a valid Site', function (done) {
        var Site = app.models.Site
        , site = new SiteStub;

        // Mock Site#create
        Site.create = sinon.spy(function (data, callback) {
            callback(null, site);
        });

        request(app)
        .post('/sites')
        .send({ "Site": site })
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            Site.create.calledWith(site).should.be.true;

            done();
        });
    });

    /*
     * POST /sites
     * Should fail when Site is invalid
     */
    it('should fail on POST /sites when Site#create returns an error', function (done) {
        var Site = app.models.Site
        , site = new SiteStub;

        // Mock Site#create
        Site.create = sinon.spy(function (data, callback) {
            callback(new Error, site);
        });

        request(app)
        .post('/sites')
        .send({ "Site": site })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Site.create.calledWith(site).should.be.true;

            app.didFlash('error').should.be.true;

            done();
        });
    });

    /*
     * PUT /sites/:id
     * Should redirect back to /sites when Site is valid
     */
    it('should redirect on PUT /sites/:id with a valid Site', function (done) {
        var Site = app.models.Site
        , site = new SiteStub;

        Site.find = sinon.spy(function (id, callback) {
            callback(null, {
                id: 1,
                updateAttributes: function (data, cb) { cb(null) }
            });
        });

        request(app)
        .put('/sites/1')
        .send({ "Site": site })
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            res.header['location'].should.include('/sites/1');

            app.didFlash('error').should.be.false;

            done();
        });
    });

    /*
     * PUT /sites/:id
     * Should not redirect when Site is invalid
     */
    it('should fail / not redirect on PUT /sites/:id with an invalid Site', function (done) {
        var Site = app.models.Site
        , site = new SiteStub;

        Site.find = sinon.spy(function (id, callback) {
            callback(null, {
                id: 1,
                updateAttributes: function (data, cb) { cb(new Error) }
            });
        });

        request(app)
        .put('/sites/1')
        .send({ "Site": site })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.didFlash('error').should.be.true;

            done();
        });
    });

    /*
     * DELETE /sites/:id
     * -- TODO: IMPLEMENT --
     */
    it('should delete a Site on DELETE /sites/:id');

    /*
     * DELETE /sites/:id
     * -- TODO: IMPLEMENT FAILURE --
     */
    it('should not delete a Site on DELETE /sites/:id if it fails');
});
