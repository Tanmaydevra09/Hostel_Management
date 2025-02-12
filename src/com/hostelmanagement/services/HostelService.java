package com.hostelmanagement.services;

import com.hostelmanagement.dao.RoomDAO;
import com.hostelmanagement.models.Room;

import java.util.List;

public class HostelService {
    private RoomDAO hostelDAO = new RoomDAO();

    public List<Room> getAllRooms() {
        return hostelDAO.getAllRooms();
    }

    public void addRoom(Room room) {
        hostelDAO.addRoom(room);
    }

    // Add more methods as needed
}
