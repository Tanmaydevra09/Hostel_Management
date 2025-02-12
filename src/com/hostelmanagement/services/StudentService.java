package com.hostelmanagement.services;

import com.hostelmanagement.dao.StudentDAO;
import com.hostelmanagement.models.Student;

import java.util.List;

public class StudentService {
    private StudentDAO studentDAO = new StudentDAO();

    public List<Student> getAllStudents() {
        return studentDAO.getAllStudents();
    }

    public void addStudent(Student student) {
        studentDAO.addStudent(student);
    }

    // New deleteStudent method
    public void deleteStudent(int studentId) {
        // Optional: Add validation or business logic here before deletion
        studentDAO.deleteStudent(studentId);
    }

    // Add more methods as needed
}
