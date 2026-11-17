import { Request, Response } from 'express';
import {
  approvePatientAccess,
  createPatientAccessRequest,
  findIdentityByEmail,
  listMemberPatients,
  listPatientAccess,
  revokePatientAccess,
  UserRole,
} from '../Services/identityService';

const careTeamRoles: UserRole[] = ['CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'];

export const getMyPatientAssignments = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await listMemberPatients(req.user!.id));
  } catch (error) {
    console.error('Patient assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPatientAccess = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId) return res.status(400).json({ message: 'Patient scope is required' });

    res.status(200).json(await listPatientAccess(patientId));
  } catch (error) {
    console.error('Patient access list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const requestPatientAccess = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    const memberEmail = String(req.body.memberEmail || '').trim();
    if (!patientId || !memberEmail) {
      return res.status(400).json({ message: 'Provide the care-team member email' });
    }

    const member = await findIdentityByEmail(memberEmail);
    if (!member || !careTeamRoles.includes(member.role)) {
      return res.status(400).json({ message: 'The selected account must have a caregiver, family coordinator, or doctor role' });
    }

    await createPatientAccessRequest(patientId, member.id.trim(), req.user!.id);
    res.status(201).json({ status: 'PENDING', message: 'The patient must approve this access request' });
  } catch (error) {
    console.error('Patient access request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approvePatientAccessRequest = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    const memberId = String(req.params.memberId || '').trim();
    if (!patientId || !/^[a-fA-F0-9]{24}$/.test(memberId)) {
      return res.status(400).json({ message: 'Provide a valid memberId' });
    }

    const approved = await approvePatientAccess(patientId, memberId);
    if (!approved) return res.status(404).json({ message: 'Pending access request not found' });

    res.status(200).json({ status: 'ACTIVE', message: 'Patient access approved' });
  } catch (error) {
    console.error('Patient access approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const revokePatientAccessForMember = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    const memberId = String(req.params.memberId || '').trim();
    if (!patientId || !/^[a-fA-F0-9]{24}$/.test(memberId)) {
      return res.status(400).json({ message: 'Provide a valid memberId' });
    }

    const revoked = await revokePatientAccess(patientId, memberId);
    if (!revoked) return res.status(404).json({ message: 'Active access grant not found' });

    res.status(200).json({ status: 'REVOKED', message: 'Patient access revoked' });
  } catch (error) {
    console.error('Patient access revocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};