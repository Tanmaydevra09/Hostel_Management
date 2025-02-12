package com.hostelmanagement.services;

import com.hostelmanagement.dao.FeeDAO;
import com.hostelmanagement.models.Fee;

import java.util.List;

public class FeeService {
    private FeeDAO feeDAO = new FeeDAO();

    public List<Fee> getAllFees() {
        return feeDAO.getAllFees();
    }

    public void addFee(Fee fee) {
        feeDAO.addFee(fee);
    }

    // Add more methods as needed
}
