var Backup = function () {

  this.defineProperties({
    backupid: {type: 'int'},
    description: {type: 'string'},
    comment: {type: 'string'},
    backupstart: {type: 'datetime'},
    backupend: {type: 'datetime'},
    status: {type: 'string'},
    origin: {type: 'string'},
    type: {type: 'string'},
    profileid: {type: 'int'},
    multipart: {type: 'boolean'},
    tag: {type: 'string'},
    fileexist: {type: 'boolean'},
    meta: {type: 'string'},
    size: {type: 'int'},
    archive: {type: 'string'}
  });
  
  /*
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
  this.property('lastName', 'string');
  this.property('firstName', 'string');

  this.validatesPresent('login');
  this.validatesFormat('login', /[a-z]+/, {message: 'Subdivisions!'});
  this.validatesLength('login', {min: 3});
  // Use with the name of the other parameter to compare with
  this.validatesConfirmed('password', 'confirmPassword');
  // Use with any function that returns a Boolean
  this.validatesWithFunction('password', function (s) {
      return s.length > 0;
  });

  // Can define methods for instances like this
  this.someMethod = function () {
    // Do some stuff
  };
  */

};

/*
// Can also define them on the prototype
Backup.prototype.someOtherMethod = function () {
  // Do some other stuff
};
// Can also define static methods and properties
Backup.someStaticMethod = function () {
  // Do some other stuff
};
Backup.someStaticProperty = 'YYZ';
*/

exports.Backup = Backup;

