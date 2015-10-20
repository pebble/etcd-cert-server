NAME=etcd-cert-server
ENV_VARS=PORT=0 NODE_ENV=test

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

lint:
	node_modules/.bin/eslint ./

test-travis: lint
	@ $(ENV_VARS) \
		node \
		node_modules/.bin/istanbul cover \
		node_modules/.bin/_mocha \
		-- \
		--bail \
		-A --recursive $(MOCHA_OPTS)
	@ $(ENV_VARS) \
		node \
		node_modules/.bin/istanbul check-coverage \
		--statements 100 --functions 100 --branches 100 --lines 100


NUM_INSTANCES := $(shell grep '^$$num_instances' < test/Vagrantfile | sed 's/.*=[ ]*//' )


build/discoverytoken:
	@mkdir -p build/
	curl -s https://discovery.etcd.io/new?size=$(NUM_INSTANCES) > build/discoverytoken
	@sed s@__DISCOVERY__@`cat build/discoverytoken`@ < test/cloud-config > build/cloud-config

test: build/discoverytoken
	mkdir -p build/
	tar -cvvf build/app.tar *.js openssl.conf package.json start.sh aws pkix resources Dockerfile

	# Launch vagrant VM to host etcd-cert-server
	# see test/Vagrantfile for bootstrapping info
	cd test && vagrant up core-master
	sleep 5

	# Launch each worker (who will use core-master to bootstrap etcd)
	cd test && vagrant up
	cd test && vagrant ssh core-01 -- ./test.sh


.PHONY: clean build test run test-travis lint

