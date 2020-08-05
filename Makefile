# Cancel implicit rules on top Makefile
$(CURDIR)/Makefile Makefile: ;

-include $(wildcard Makefile.*)

SHELL := /bin/bash

GIT_REMOTE_URL ?= $(shell git remote get-url origin)
GIT_SHA ?= $(shell git rev-parse HEAD)
GIT_BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD | tr -s "[:punct:]" "-" | tr -s "[:upper:]" "[:lower:]")
GIT_CURRENT_VERSION_TAG ?= $(shell git tag --list "[0-9]*" --sort="-version:refname" --points-at HEAD | head -n 1)
GIT_LATEST_VERSION_TAG ?= $(shell git tag --list "[0-9]*" --sort="-version:refname" | head -n 1)

ifeq ($(GIT_BRANCH),head)
ifneq ($(GIT_CURRENT_VERSION_TAG),)
GIT_BRANCH = master
GIT_LATEST_VERSION_TAG = $(GIT_CURRENT_VERSION_TAG)
else
$(error "Missing valid git version tag!")
endif
endif

PROJECT_DIR ?= $(realpath $(dir $(lastword $(MAKEFILE_LIST))))
PROJECT_NAME ?= $(basename $(notdir $(GIT_REMOTE_URL)))

DOCKER_IMAGE_NAME ?= $(PROJECT_NAME)
DOCKER_CONTAINER_NAME ?= $(PROJECT_NAME)
DOCKER_REPO_NAMESPACE ?= schulcloud
DOCKER_REPO_NAME ?= $(DOCKER_REPO_NAMESPACE)/$(DOCKER_IMAGE_NAME)
DOCKER_VERSION_TAG ?= $(GIT_BRANCH)_v$(GIT_LATEST_VERSION_TAG)_$(GIT_SHA)
ifeq ($(GIT_LATEST_VERSION_TAG),)
DOCKER_VERSION_TAG = $(GIT_BRANCH)_$(GIT_SHA)
endif
DOCKER_SHA_TAG ?= $(GIT_SHA)

.PHONY: self-init
self-init::
	$(info TODO: Implement recipes for self-init)

.PHONY: self-update
self-update::
	$(info TODO: Implement recipes for self-update)

.PHONY: clean
clean:: stop
	docker rm --force $(DOCKER_CONTAINER_NAME) 2>/dev/null || true
	docker image rm --force \
		$(DOCKER_REPO_NAME):$(DOCKER_VERSION_TAG) \
		$(DOCKER_REPO_NAME):$(DOCKER_SHA_TAG) \
		$(DOCKER_IMAGE_NAME) 2>/dev/null || true
	docker image prune --force \
		--filter label="build.stage=test" \
		--filter label="build.branch=$(GIT_BRANCH)" \
		--filter label="build.hash=$(GIT_SHA)" 2>/dev/null || true
	docker image prune --force \
		--filter label="build.stage=builder" \
		--filter label="build.branch=$(GIT_BRANCH)" \
		--filter label="build.hash=$(GIT_SHA)" 2>/dev/null || true

.PHONY: build
build:: DOCKER_BUILD_OPTIONS += --pull --no-cache --force-rm --rm \
	--build-arg BUILD_BRANCH=$(GIT_BRANCH) \
	--build-arg BUILD_HASH=$(GIT_SHA) \
	--file "$(PROJECT_DIR)/Dockerfile" \
	--tag $(DOCKER_IMAGE_NAME)
build::
	docker build $(DOCKER_BUILD_OPTIONS) "$(PROJECT_DIR)"

.PHONY: tags
tags:: DOCKER_TAG_OPTIONS +=
tags::
	docker tag $(DOCKER_TAG_OPTIONS) $(DOCKER_IMAGE_NAME) $(DOCKER_REPO_NAME):$(DOCKER_VERSION_TAG)
	docker tag $(DOCKER_TAG_OPTIONS) $(DOCKER_IMAGE_NAME) $(DOCKER_REPO_NAME):$(DOCKER_SHA_TAG)

.PHONY: push
push:: DOCKER_PUSH_OPTIONS ?=
push:: tags
	docker push $(DOCKER_PUSH_OPTIONS) $(DOCKER_REPO_NAME):$(DOCKER_VERSION_TAG)
	docker push $(DOCKER_PUSH_OPTIONS) $(DOCKER_REPO_NAME):$(DOCKER_SHA_TAG)

.PHONY: deploy
deploy::
	$(info TODO: Implement recipes for deploy)

.PHONY: run
run:: DOCKER_RUN_OPTIONS += --rm --interactive --tty --name $(DOCKER_CONTAINER_NAME)
run:: DOCKER_RUN_COMMAND ?=
run::
	docker run $(DOCKER_RUN_OPTIONS) $(DOCKER_IMAGE_NAME) $(DOCKER_RUN_COMMAND)

.PHONY: stop
stop::
	docker stop $(DOCKER_CONTAINER_NAME) 2>/dev/null || true

.PHONY: exec
exec:: DOCKER_EXEC_OPTIONS += --interactive --tty
exec:: DOCKER_EXEC_COMMAND ?= /bin/sh
exec::
	docker exec $(DOCKER_EXEC_OPTIONS) $(DOCKER_CONTAINER_NAME) $(DOCKER_EXEC_COMMAND)
