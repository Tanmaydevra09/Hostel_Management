package com.hostelmanagement;

import com.hostelmanagement.ui.HostelManagementUI;

import javax.swing.SwingUtilities;

public class Main{
    public static void main(String[] args) {
        // Ensure the UI creation is done on the Event Dispatch Thread
        SwingUtilities.invokeLater(() -> {
            try {
                // Create and show the Hostel Management UI
                HostelManagementUI ui = new HostelManagementUI();
                ui.setVisible(true);
            } catch (Exception e) {
                e.printStackTrace();
                System.err.println("Error initializing the Hostel Management System.");
            }
        });
    }
}
