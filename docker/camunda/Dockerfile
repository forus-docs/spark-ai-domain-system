FROM camunda/camunda-bpm-platform:7.20.0

# Install Keycloak Identity Provider Plugin
USER root

# Download the Keycloak Identity Provider Plugin
# Note: You may need to build this from source or use a compatible version
RUN curl -L https://github.com/camunda-community-hub/camunda-bpm-identity-keycloak/releases/download/7.20.3/camunda-bpm-identity-keycloak-7.20.3-all.jar \
    -o /camunda/webapps/camunda/WEB-INF/lib/camunda-bpm-identity-keycloak.jar

# Copy custom configuration
COPY ./camunda.cfg.xml /camunda/webapps/engine-rest/WEB-INF/classes/META-INF/processes.xml

USER camunda