# Step 1: Use OpenJDK as the base image
FROM openjdk:22

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy the JAR files and resources into the container
COPY ./out /app/out
COPY ./resources /app/resources
COPY ./lib/mysql-connector-j-9.0.0.jar /app/lib/mysql-connector-j-9.0.0.jar

# Step 4: Define the command to run your Java application with the correct classpath and headless mode enabled
CMD ["java", "-Djava.awt.headless=true", "-cp", "/app/out:/app/resources:/app/lib/mysql-connector-j-9.0.0.jar", "com.hostelmanagement.Main"]

