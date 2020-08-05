# Check if its included in a Makefile(.*)
ifneq ($(notdir $(firstword $(MAKEFILE_LIST))),Makefile)
$(error ERROR: This file has to be included in Makefile)
endif
