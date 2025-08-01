FROM camunda/camunda-bpm-platform:7.20.0

# Install Keycloak Identity Provider Plugin
USER root

# Install wget and gettext (for envsubst) if not available
RUN apk add --no-cache wget gettext

# Create lib directory if it doesn't exist
RUN mkdir -p /camunda/lib

# Download the Keycloak plugin from Maven Central
# Using the -all version that includes all dependencies
RUN wget -O /camunda/lib/camunda-platform-7-keycloak-all-7.20.0.jar \
    https://repo1.maven.org/maven2/org/camunda/bpm/extension/camunda-platform-7-keycloak-all/7.20.0/camunda-platform-7-keycloak-all-7.20.0.jar

# Copy configuration template and startup script
COPY bpm-platform.xml.template /camunda/conf/bpm-platform.xml.template
COPY startup.sh /camunda/startup.sh

# Ensure proper permissions
RUN chmod +x /camunda/startup.sh && \
    chown -R camunda:camunda /camunda/lib /camunda/conf /camunda/startup.sh

USER camunda

# Override the default command to use our startup script
CMD ["/camunda/startup.sh"]