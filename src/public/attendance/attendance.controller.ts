import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import { Attendance } from "../../modals/attendance.model";

const attendanceService = new CommonService(Attendance);

export class AttendanceController {
  static async markAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      // Create or update attendance record based on unique keys like studentId + date + slotId
      const { studentId, slotId, date, status } = req.body;

      let attendance = await Attendance.findOne({ studentId, slotId, date });

      if (attendance) {
        attendance.status = status;
      } else {
        attendance = new Attendance(req.body);
      }

      await attendance.save();

      return res.status(200).json(new ApiResponse(200, attendance, "Attendance marked successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAttendanceByStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const attendanceRecords = await attendanceService.getAll({ studentId });
      return res.status(200).json(new ApiResponse(200, attendanceRecords, "Attendance records fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAttendanceBySlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { slotId } = req.params;
      const attendanceRecords = await attendanceService.getAll({ slotId });
      return res.status(200).json(new ApiResponse(200, attendanceRecords, "Attendance records fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Add update/delete if needed
}
