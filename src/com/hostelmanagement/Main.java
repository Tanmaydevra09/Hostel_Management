package com.hostelmanagement;

import com.hostelmanagement.ui.HostelManagementUI;

import javax.swing.*;
import java.awt.*;

public class Main {
    public static void main(String[] args) {
        // Check if the environment is headless
        if (GraphicsEnvironment.isHeadless()) {
            System.out.println("Running in headless mode.");
        } else {
            System.out.println("Running with GUI.");
        }

        // Ensure the UI creation is done on the Event Dispatch Thread
        SwingUtilities.invokeLater(() -> {
            try {
                if (GraphicsEnvironment.isHeadless()) {
                    // You may log, or handle this case differently
                    System.err.println("GUI cannot be initialized in headless mode.");
                } else {
                    // Create and show the Hostel Management UI
                    HostelManagementUI ui = new HostelManagementUI();
                    ui.setVisible(true);
                }
            } catch (Exception e) {
                e.printStackTrace();
                System.err.println("Error initializing the Hostel Management System.");
            }
        });
    }
}

