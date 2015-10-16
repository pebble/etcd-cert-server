'use strict';

let AWS = require('aws-sdk');

exports.client = new AWS.EC2();

exports.describeInstance = function(ip) {
  return new Promise(function(resolve, reject) {
    exports.client.describeInstances({
      'Filters': [{
        'Name': 'private-ip-address',
        'Values': [ip]
      }]
    }, function(err, data) {
      if (err) {
        return reject(err);
      }

      if (!data || !data['Reservations']) {
        return reject('Invalid response from EC2');
      }

      let reservations = data['Reservations'][0];
      let instance = reservations['Instances'][0];
      return resolve(instance);
    });
  });
};

exports.removeSecurityGroup = function(ip, sg) {
  return new Promise(function(resolve, reject) {
    exports.describeInstance(ip)
      .then(function(instanceData) {
        let instanceGroups = instanceData['SecurityGroups'];
        let groups = instanceGroups
          .map(function(instanceGroup) {
            return instanceGroup['GroupId'];
          })
          .filter(function(instanceGroupId) {
            return instanceGroupId !== sg;
          });

        if (groups.length === instanceGroups.length) {
          // Group not found, no removal necessary.
          return resolve(false);
        }

        exports.client.modifyInstanceAttribute({
          'InstanceId': instanceData['InstanceId'],
          'Groups': groups
        }, function(err) {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      })
      .catch(reject);
  });
};
