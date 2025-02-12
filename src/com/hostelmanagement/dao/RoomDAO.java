package com.hostelmanagement.dao;

import com.hostelmanagement.models.Room;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class RoomDAO {
    private Connection connection;

    public RoomDAO() {
        this.connection = DatabaseConnection.getConnection();
    }

    // Fetch all rooms from the database
    public List<Room> getAllRooms() {
        List<Room> rooms = new ArrayList<>();
        try {
            String query = "SELECT * FROM rooms";
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(query);

            while (resultSet.next()) {
                Room room = new Room(
                    resultSet.getInt("id"),
                    resultSet.getInt("room_number"),
                    resultSet.getInt("capacity")
                );
                rooms.add(room);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return rooms;
    }

    // Add a new room to the database
    public void addRoom(Room room) {
        try {
            String query = "INSERT INTO rooms (room_number, capacity) VALUES (?, ?)";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setInt(1, room.getRoomNumber());
            preparedStatement.setInt(2, room.getCapacity());
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Delete a room by room number
    public void deleteRoomByNumber(int roomNumber) {
        try {
            String query = "DELETE FROM rooms WHERE room_number = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setInt(1, roomNumber);
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Update room capacity by room number
    public void updateRoomCapacity(int roomNumber, int newCapacity) {
        try {
            String query = "UPDATE rooms SET capacity = ? WHERE room_number = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setInt(1, newCapacity);
            preparedStatement.setInt(2, roomNumber);
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Fetch room by room number
    public Room getRoomByNumber(int roomNumber) {
        Room room = null;
        try {
            String query = "SELECT * FROM rooms WHERE room_number = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setInt(1, roomNumber);
            ResultSet resultSet = preparedStatement.executeQuery();

            if (resultSet.next()) {
                room = new Room(
                    resultSet.getInt("id"),
                    resultSet.getInt("room_number"),
                    resultSet.getInt("capacity")
                );
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return room;
    }
}
