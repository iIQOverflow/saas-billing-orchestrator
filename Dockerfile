# Use a lightweight Java 17 image
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy the compiled jar file into the container
COPY target/*.jar app.jar

EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]