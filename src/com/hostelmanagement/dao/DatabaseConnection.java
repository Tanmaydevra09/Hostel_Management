package com.hostelmanagement.dao;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DatabaseConnection {
    private static Connection connection;

    // Method to get a database connection
    public static Connection getConnection() {
        if (connection == null) {
            try {
                // Load database properties
                Properties properties = new Properties();
                try (InputStream input = com.hostelmanagement.Main.class.getClassLoader().getResourceAsStream("db.properties")) {
                    if (input == null) {
                        System.err.println("Sorry, unable to find db.properties");
                        return null;
                    }
                    properties.load(input);
                }
                
                // Retrieve database connection details
                String url = properties.getProperty("db.url");
                String user = properties.getProperty("db.username");
                String password = properties.getProperty("db.password");

                // Register MySQL JDBC driver
                Class.forName("com.mysql.cj.jdbc.Driver");

                // Create a connection to the database
                connection = DriverManager.getConnection(url, user, password); 
            } catch (SQLException | IOException | ClassNotFoundException e) {
                e.printStackTrace();
                System.err.println("Failed to connect to the database.");
            }
        }
        return connection;
    }
}
