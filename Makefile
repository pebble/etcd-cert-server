NAME=etcd-cert-server

build: build/docker-image

build/docker-image:
	@mkdir -p build/
	@docker build -t $(NAME) .
	@docker inspect -f '{{.Id}}' $(NAME) > build/docker-image

run: build/docker-image
	docker run \
		-p 8080:8080 \
		-v /dev/urandom:/dev/random \
		--name $(NAME) \
		-it \
		$(NAME)

clean:
	-rm -Rf build/
	-docker rm $(NAME)
	-cd test && vagrant destroy -f



NUM_INSTANCES := $(shell grep '^$$num_instances' < test/Vagrantfile | sed 's/.*=[ ]*//' )


build/discoverytoken:
	@mkdir -p build/
	curl -s https://discovery.etcd.io/new?size=$(NUM_INSTANCES) > build/discoverytoken
	@sed s@__DISCOVERY__@`cat build/discoverytoken`@ < test/cloud-config > build/cloud-config

test: build/discoverytoken
	mkdir -p build/
	tar -cvvf build/app.tar *.js openssl.conf package.json start.sh pkix resources Dockerfile

	# Launch vagrant VM to host etcd-cert-server
	# see test/Vagrantfile for bootstrapping info
	cd test && vagrant up core-master
	sleep 5

	# Launch each worker (who will use core-master to bootstrap etcd)
	cd test && vagrant up

.PHONY: clean build test run

