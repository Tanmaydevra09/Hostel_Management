package com.hostelmanagement.dao;

import com.hostelmanagement.models.Fee;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FeeDAO {
    private Connection connection;

    public FeeDAO() {
        this.connection = DatabaseConnection.getConnection();
    }

    // Fetch all fees from the database
    public List<Fee> getAllFees() {
        List<Fee> fees = new ArrayList<>();
        try {
            String query = "SELECT * FROM fees";
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(query);

            while (resultSet.next()) {
                Fee fee = new Fee(
                    resultSet.getInt("id"),
                    resultSet.getInt("student_id"),
                    resultSet.getDouble("amount")
                );
                fees.add(fee);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return fees;
    }

    // Add a new fee record to the database
    public void addFee(Fee fee) {
        try {
            String query = "INSERT INTO fees (student_id, amount) VALUES (?, ?)";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setInt(1, fee.getStudentId());
            preparedStatement.setDouble(2, fee.getAmount());
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Delete a fee by the student ID
    public void deleteFeeByStudentId(int studentId) {
        try {
            String query = "DELETE FROM fees WHERE student_id = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setInt(1, studentId);
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Delete a fee by amount
    public void deleteFeeByAmount(double amount) {
        try {
            String query = "DELETE FROM fees WHERE amount = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setDouble(1, amount);
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Fetch fees by student ID
    public List<Fee> getFeesByStudentId(int studentId) {
        List<Fee> fees = new ArrayList<>();
        try {
            String query = "SELECT * FROM fees WHERE student_id = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setInt(1, studentId);
            ResultSet resultSet = preparedStatement.executeQuery();

            while (resultSet.next()) {
                Fee fee = new Fee(
                    resultSet.getInt("id"),
                    resultSet.getInt("student_id"),
                    resultSet.getDouble("amount")
                );
                fees.add(fee);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return fees;
    }
}
