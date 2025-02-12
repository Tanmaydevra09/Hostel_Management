package com.hostelmanagement.models;

public class Student {
    private int id;
    private String name;
    private int age;
    private String roomId;

    public Student(int id, String name, int age, String roomId) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.roomId = roomId;
    }

    // Getters and setters

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }
}
