#!/bin/bash

until $(/usr/bin/curl --output /dev/null --silent --head --fail http://172.17.8.99:8080/v1/certs/ca); do
	echo "not ready yet"
	sleep 1
done

# Wait longer for etcd sync
sleep 10

/usr/bin/curl -o ca.crt http://172.17.8.99:8080/v1/certs/ca
/usr/bin/curl http://172.17.8.99:8080/v1/certs/client/test | /bin/tar -xf -

/usr/bin/etcdctl -C https://172.17.8.101:2379 --ca-file ca.crt --key-file client.key --cert-file client.crt cluster-health
/usr/bin/etcdctl -C https://172.17.8.102:2379 --ca-file ca.crt --key-file client.key --cert-file client.crt cluster-health
/usr/bin/etcdctl -C https://172.17.8.103:2379 --ca-file ca.crt --key-file client.key --cert-file client.crt cluster-health

