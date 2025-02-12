package com.hostelmanagement.dao;

import com.hostelmanagement.models.Student;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class StudentDAO {
    private Connection connection;

    public StudentDAO() {
        this.connection = DatabaseConnection.getConnection();
    }

    public List<Student> getAllStudents() {
        List<Student> students = new ArrayList<>();
        try {
            String query = "SELECT * FROM students";
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(query);

            while (resultSet.next()) {
                Student student = new Student(
                    resultSet.getInt("id"),
                    resultSet.getString("name"),
                    resultSet.getInt("age"),
                    resultSet.getString("room_id")
                );
                students.add(student);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return students;
    }

    public void addStudent(Student student) {
        try {
            String query = "INSERT INTO students (name, age, room_id) VALUES (?, ?, ?)";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setString(1, student.getName());
            preparedStatement.setInt(2, student.getAge());
            preparedStatement.setString(3, student.getRoomId());
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // New deleteStudent method
    public void deleteStudent(int studentId) {
        try {
            String query = "DELETE FROM students WHERE id = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setInt(1, studentId);

            int rowsAffected = preparedStatement.executeUpdate();
            if (rowsAffected == 0) {
                System.out.println("No student found with the given ID.");
            } else {
                System.out.println("Student deleted successfully.");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Other CRUD operations...
}
