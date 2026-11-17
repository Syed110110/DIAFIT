import express from 'express';
import {
  approvePatientAccessRequest,
  getPatientAccess,
  getMyPatientAssignments,
  revokePatientAccessForMember,
  requestPatientAccess,
} from '../controllers/patientAccessController';
import { protect } from '../middleware/auth';
import { authorizeRoles, requirePatientScope } from '../middleware/authorization';

const router = express.Router();

router.get(
  '/assignments',
  protect,
  authorizeRoles('CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'),
  getMyPatientAssignments
);
router.get(
  '/:patientId/access',
  protect,
  requirePatientScope('PATIENT', 'FAMILY_COORDINATOR'),
  getPatientAccess
);
router.post(
  '/:patientId/access',
  protect,
  requirePatientScope('PATIENT', 'FAMILY_COORDINATOR'),
  requestPatientAccess
);
router.post(
  '/:patientId/access/:memberId/approve',
  protect,
  requirePatientScope('PATIENT'),
  authorizeRoles('PATIENT'),
  approvePatientAccessRequest
);
router.delete(
  '/:patientId/access/:memberId',
  protect,
  requirePatientScope('PATIENT'),
  authorizeRoles('PATIENT'),
  revokePatientAccessForMember
);

export default router;