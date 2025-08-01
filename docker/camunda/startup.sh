#!/bin/sh

# Replace environment variables in bpm-platform.xml
envsubst < /camunda/conf/bpm-platform.xml.template > /camunda/conf/bpm-platform.xml

# Start Camunda
exec /camunda/camunda.sh