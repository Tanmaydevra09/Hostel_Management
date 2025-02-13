package com.hostelmanagement;

import com.hostelmanagement.ui.HostelManagementUI;

import javax.swing.SwingUtilities;
import java.awt.GraphicsEnvironment;

public class Main {
    public static void main(String[] args) {
        // Check if the environment is headless and set the system property
        if (GraphicsEnvironment.isHeadless()) {
            System.setProperty("java.awt.headless", "true");
        }

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

