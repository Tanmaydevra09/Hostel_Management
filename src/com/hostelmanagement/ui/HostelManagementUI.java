package com.hostelmanagement.ui;

import com.hostelmanagement.dao.StudentDAO;
import com.hostelmanagement.models.Student;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.List;

public class HostelManagementUI extends JFrame 

{
    private StudentDAO studentDAO;
    private JTable studentTable;
    private JTextField nameField;
    private JTextField ageField;
    private JTextField roomIdField;
    private DefaultTableModel tableModel;

    public HostelManagementUI() {
        studentDAO = new StudentDAO();
        initializeUI();
    }

    private void initializeUI() {
        setTitle("Hostel Management System");
        setSize(800, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout(10, 10));

        add(createMainPanel(), BorderLayout.CENTER);
        add(createInputPanel(), BorderLayout.NORTH);
    }

    private JPanel createMainPanel() {
        JPanel mainPanel = new JPanel();
        mainPanel.setLayout(new BorderLayout(10, 10));

        // Table for displaying student data
        String[] columnNames = {"ID", "Name", "Age", "Room ID"};
        tableModel = new DefaultTableModel(columnNames, 0);
        studentTable = new JTable(tableModel);
        studentTable.setFillsViewportHeight(true);
        studentTable.setRowHeight(30);
        studentTable.setFont(new Font("Arial", Font.PLAIN, 14));
        studentTable.getTableHeader().setFont(new Font("Arial", Font.BOLD, 14));
        
        JScrollPane scrollPane = new JScrollPane(studentTable);
        mainPanel.add(scrollPane, BorderLayout.CENTER);

        return mainPanel;
    }

    private JPanel createInputPanel() {
        JPanel inputPanel = new JPanel();
        inputPanel.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Input fields
        gbc.gridx = 0;
        gbc.gridy = 0;
        inputPanel.add(new JLabel("Name:"), gbc);
        gbc.gridx = 1;
        nameField = new JTextField(15);
        inputPanel.add(nameField, gbc);

        gbc.gridx = 0;
        gbc.gridy = 1;
        inputPanel.add(new JLabel("Age:"), gbc);
        gbc.gridx = 1;
        ageField = new JTextField(15);
        inputPanel.add(ageField, gbc);

        gbc.gridx = 0;
        gbc.gridy = 2;
        inputPanel.add(new JLabel("Room ID:"), gbc);
        gbc.gridx = 1;
        roomIdField = new JTextField(15);
        inputPanel.add(roomIdField, gbc);

        // Buttons
        gbc.gridx = 0;
        gbc.gridy = 3;
        gbc.gridwidth = 2;
        gbc.anchor = GridBagConstraints.CENTER;

        JPanel buttonPanel = new JPanel();
        buttonPanel.setLayout(new FlowLayout(FlowLayout.CENTER, 10, 10));

        JButton addButton = createStyledButton("Add Student");
        addButton.addActionListener(e -> addStudent());
        buttonPanel.add(addButton);

        JButton viewButton = createStyledButton("View Students");
        viewButton.addActionListener(e -> viewStudents());
        buttonPanel.add(viewButton);

        JButton deleteButton = createStyledButton("Delete Student");
        deleteButton.addActionListener(e -> deleteStudent());
        buttonPanel.add(deleteButton);

        inputPanel.add(buttonPanel, gbc);

        return inputPanel;
    }

    private JButton createStyledButton(String text) {
        JButton button = new JButton(text);
        button.setBackground(Color.DARK_GRAY);
        button.setForeground(Color.BLACK); // Change text color to black
        button.setFocusPainted(false);
        button.setBorder(BorderFactory.createLineBorder(Color.WHITE, 2));
        button.setFont(new Font("Arial", Font.BOLD, 16));
        button.setPreferredSize(new Dimension(150, 30));
        return button;
    }

    private void addStudent() {
        try {
            String name = nameField.getText();
            int age = Integer.parseInt(ageField.getText());
            String roomId = roomIdField.getText(); // Room ID as String

            Student student = new Student(0, name, age, roomId);
            studentDAO.addStudent(student);

            nameField.setText("");
            ageField.setText("");
            roomIdField.setText("");

            JOptionPane.showMessageDialog(this, "Student added successfully!");
        } catch (NumberFormatException e) {
            JOptionPane.showMessageDialog(this, "Invalid input. Please enter valid data.", "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void viewStudents() {
        List<Student> students = studentDAO.getAllStudents();
        tableModel.setRowCount(0); // Clear existing data
        for (Student student : students) {
            Object[] row = {student.getId(), student.getName(), student.getAge(), student.getRoomId()};
            tableModel.addRow(row);
        }
    }

    private void deleteStudent() {
        int selectedRow = studentTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "Please select a student to delete.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        int studentId = (int) tableModel.getValueAt(selectedRow, 0); // Get the ID of the selected student
        studentDAO.deleteStudent(studentId); // Remove the student from the database
        tableModel.removeRow(selectedRow); // Remove the student from the table model

        JOptionPane.showMessageDialog(this, "Student deleted successfully!");
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            HostelManagementUI ui = new HostelManagementUI();
            ui.setVisible(true);
        });
    }
}
