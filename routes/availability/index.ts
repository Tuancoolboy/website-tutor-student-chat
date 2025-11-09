/**
 * Availability APIs
 * GET /api/availability/:tutorId - Get tutor availability
 * POST /api/availability - Set availability
 * PUT /api/availability/:id - Update availability
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Availability, UserRole } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/availability/:tutorId
 * Returns availability with class schedules excluded
 */
export async function getAvailabilityHandler(req: any, res: Response) {
  try {
    const { tutorId } = req.params;
    const { excludeClasses } = req.query; // Optional query param to exclude classes

    // Verify tutor exists
    const tutor = await storage.findById('users.json', tutorId);
    if (!tutor || tutor.role !== UserRole.TUTOR) {
      return res.status(404).json(errorResponse('Không tìm thấy gia sư'));
    }

    // Get availability
    const availabilities = await storage.find<Availability>(
      'availability.json',
      (a) => a.tutorId === tutorId
    );

    if (availabilities.length === 0) {
      return res.json(
        successResponse({
          tutorId,
          timeSlots: [],
          exceptions: []
        })
      );
    }

    const availability = availabilities[0];

    // If excludeClasses is true, remove time slots that overlap with class schedules
    if (excludeClasses === 'true') {
      const { Class, ClassStatus } = await import('../../lib/types.js');
      
      // Get all active classes for this tutor
      const tutorClasses = await storage.find<Class>(
        'classes.json',
        (c) => c.tutorId === tutorId && c.status !== ClassStatus.INACTIVE
      );

      // If no classes, return original availability
      if (tutorClasses.length === 0) {
        return res.json(successResponse(availability));
      }

      // Split time slots around class schedules
      const adjustedSlots: typeof availability.timeSlots = [];
      
      for (const slot of availability.timeSlots) {
        const parseTime = (time: string): number => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const slotStart = parseTime(slot.startTime);
        const slotEnd = parseTime(slot.endTime);

        // Find classes on the same day
        const sameDayClasses = tutorClasses.filter(c => 
          c.day.toLowerCase() === slot.day.toLowerCase()
        ).sort((a, b) => {
          const parseTime = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };
          return parseTime(a.startTime) - parseTime(b.startTime);
        });

        let currentStart = slotStart;
        
        for (const classItem of sameDayClasses) {
          const classStart = parseTime(classItem.startTime);
          const classEnd = parseTime(classItem.endTime);

          // If slot starts before class, add slot from start to class start
          if (currentStart < classStart && currentStart < slotEnd) {
            const end = Math.min(classStart, slotEnd);
            if (end > currentStart) {
              adjustedSlots.push({
                day: slot.day,
                startTime: `${Math.floor(currentStart / 60).toString().padStart(2, '0')}:${(currentStart % 60).toString().padStart(2, '0')}`,
                endTime: `${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')}`
              });
            }
          }

          // Update current start to after class end if slot continues
          if (classEnd > currentStart) {
            currentStart = Math.max(currentStart, classEnd);
          }
        }

        // Add remaining slot after all classes
        if (currentStart < slotEnd) {
          adjustedSlots.push({
            day: slot.day,
            startTime: `${Math.floor(currentStart / 60).toString().padStart(2, '0')}:${(currentStart % 60).toString().padStart(2, '0')}`,
            endTime: `${Math.floor(slotEnd / 60).toString().padStart(2, '0')}:${(slotEnd % 60).toString().padStart(2, '0')}`
          });
        }
      }

      return res.json(successResponse({
        ...availability,
        timeSlots: adjustedSlots.length > 0 ? adjustedSlots : availability.timeSlots
      }));
    }

    return res.json(successResponse(availability));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy lịch rảnh: ' + error.message)
    );
  }
}

/**
 * POST /api/availability
 */
export async function setAvailabilityHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { timeSlots, exceptions } = req.body;

    // Only tutors can set availability
    if (currentUser.role !== UserRole.TUTOR) {
      return res.status(403).json(
        errorResponse('Chỉ gia sư mới có thể cài đặt lịch rảnh')
      );
    }

    // Check if availability already exists
    const existing = await storage.find<Availability>(
      'availability.json',
      (a) => a.tutorId === currentUser.userId
    );

    let availability: Availability;

    if (existing.length > 0) {
      // Update existing
      availability = (await storage.update<Availability>(
        'availability.json',
        existing[0].id,
        {
          timeSlots,
          exceptions: exceptions || [],
          updatedAt: now()
        }
      ))!;
    } else {
      // Create new
      availability = {
        id: generateId('avail'),
        tutorId: currentUser.userId,
        timeSlots,
        exceptions: exceptions || [],
        createdAt: now(),
        updatedAt: now()
      };
      await storage.create('availability.json', availability);
    }

    return res.json(
      successResponse(availability, 'Cài đặt lịch rảnh thành công')
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cài đặt lịch rảnh: ' + error.message)
    );
  }
}

/**
 * PUT /api/availability/:id
 */
export async function updateAvailabilityHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUser = req.user!;

    const availability = await storage.findById<Availability>('availability.json', id);
    if (!availability) {
      return res.status(404).json(errorResponse('Không tìm thấy lịch rảnh'));
    }

    // Authorization: only the tutor can update their own availability
    if (availability.tutorId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền cập nhật lịch rảnh này')
      );
    }

    const updated = await storage.update<Availability>(
      'availability.json',
      id,
      { ...updates, updatedAt: now() }
    );

    return res.json(successResponse(updated, 'Cập nhật lịch rảnh thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cập nhật lịch rảnh: ' + error.message)
    );
  }
}

