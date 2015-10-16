'use strict';

let ec2 = require('../../aws/securityGroup');
let assert = require('assert');
let sinon = require('sinon');

let IP = '127.0.0.1';
let INSTANCE_ID = 'i-123456';
let SECURITY_GROUP = 'sg-123456';
let SECURITY_GROUP_OTHER = 'sg-654321';

describe('aws/securityGroups', function() {
  beforeEach(function() {
    this.sinon = sinon.sandbox.create();
  });

  afterEach(function() {
    this.sinon.restore();
  });

  it('describes instance - success', function*() {
    this.sinon.stub(ec2.client, 'describeInstances', function(params, cb) {
      assert.equal(params['Filters'].length, 1);
      let instanceFilter = params['Filters'][0];
      assert.equal(instanceFilter['Name'], 'private-ip-address');
      assert.deepEqual(instanceFilter['Values'], [IP]);

      cb(undefined, {
        'Reservations': [{
          'Instances': [{
            'InstanceId': INSTANCE_ID
          }]
        }]
      });
    });

    let instanceData = yield ec2.describeInstance(IP);
    assert.equal(INSTANCE_ID, instanceData['InstanceId']);
  });

  it('describes instance - client failure', function(done) {
    this.sinon.stub(ec2.client, 'describeInstances', function(params, cb) {
      cb('kaboom', undefined);
    });

    ec2.describeInstance(IP)
      .catch(function(err) {
        assert.equal('kaboom', err);
        done();
      });
  });

  it('describes instance - bad response', function(done) {
    this.sinon.stub(ec2.client, 'describeInstances', function(params, cb) {
      cb(undefined, {});
    });

    ec2.describeInstance(IP)
      .catch(function(err) {
        assert.equal('Invalid response from EC2', err);
        done();
      });
  });

  it('removes instance from security group - found', function() {
    this.sinon.stub(ec2, 'describeInstance', function() {
      return Promise.resolve({
        'InstanceId': INSTANCE_ID,
        'SecurityGroups': [
          {'GroupId': SECURITY_GROUP},
          {'GroupId': SECURITY_GROUP_OTHER}
        ]
      });
    });
    this.sinon.stub(ec2.client, 'modifyInstanceAttribute', function(params, cb) {
      assert.equal(params['InstanceId'], INSTANCE_ID);
      assert.deepEqual(params['Groups'], [SECURITY_GROUP_OTHER]);
      cb();
    });

    ec2.removeSecurityGroup(IP, SECURITY_GROUP);
  });

  it('removes instance from security group - not found', function() {
    this.sinon.stub(ec2, 'describeInstance', function() {
      return Promise.resolve({
        'InstanceId': INSTANCE_ID,
        'SecurityGroups': [
          {'GroupId': SECURITY_GROUP_OTHER}
        ]
      });
    });
    this.sinon.stub(ec2.client, 'modifyInstanceAttribute', 0);

    ec2.removeSecurityGroup(IP, SECURITY_GROUP);
  });

  it('removes instance from security group - error', function(done) {
    this.sinon.stub(ec2, 'describeInstance', function() {
      return Promise.resolve({
        'InstanceId': INSTANCE_ID,
        'SecurityGroups': [
          {'GroupId': SECURITY_GROUP},
          {'GroupId': SECURITY_GROUP_OTHER}
        ]
      });
    });
    this.sinon.stub(ec2.client, 'modifyInstanceAttribute', function(params, cb) {
      assert.equal(params['InstanceId'], INSTANCE_ID);
      assert.deepEqual(params['Groups'], [SECURITY_GROUP_OTHER]);
      cb('kaboom');
    });

    ec2.removeSecurityGroup(IP, SECURITY_GROUP)
      .catch(function(err) {
        assert.equal('kaboom', err);
        done();
      });
  });
});
