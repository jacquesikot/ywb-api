import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import EducationRepo from '../database/repository/EducationRepo';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user: { _id: Types.ObjectId };
}

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Education
 *     description: Education history management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Education:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the education record
 *         user:
 *           type: string
 *           description: The user ID associated with this education record
 *         degree:
 *           type: string
 *           description: Degree obtained
 *         fieldOfStudy:
 *           type: string
 *           description: Field of study
 *         institutionName:
 *           type: string
 *           description: Name of the institution
 *         location:
 *           type: string
 *           description: Location of the institution
 *         institutionWebsite:
 *           type: string
 *           description: Website of the institution
 *         startYear:
 *           type: integer
 *           description: Start year
 *         endYear:
 *           type: integer
 *           description: End year
 *         description:
 *           type: string
 *           description: Additional description
 *       required:
 *         - user
 *         - degree
 *         - fieldOfStudy
 *         - institutionName
 *         - startYear
 */

/**
 * @swagger
 * /education:
 *   post:
 *     summary: Add a new education record
 *     tags: [Education]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Education'
 *     responses:
 *       201:
 *         description: Education record created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Education'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const education = await EducationRepo.create({
      ...req.body,
      user: req.user._id,
    });
    res.status(201).json(education);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/**
 * @swagger
 * /education:
 *   get:
 *     summary: Get all education records for the authenticated user
 *     tags: [Education]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of education records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Education'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const educations = await EducationRepo.findByUser(req.user._id);
    res.json(educations);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/**
 * @swagger
 * /education/{id}:
 *   put:
 *     summary: Update an education record by ID
 *     tags: [Education]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The education record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Education'
 *     responses:
 *       200:
 *         description: Education record updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Education'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Education record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const updated = await EducationRepo.updateById(
      new Types.ObjectId(req.params.id),
      req.body,
    );
    if (!updated) return res.status(404).json({ error: 'Education not found' });
    res.json(updated);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/**
 * @swagger
 * /education/{id}:
 *   delete:
 *     summary: Delete an education record by ID
 *     tags: [Education]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The education record ID
 *     responses:
 *       200:
 *         description: Education record deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Education record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await EducationRepo.deleteById(
      new Types.ObjectId(req.params.id),
    );
    if (!deleted) return res.status(404).json({ error: 'Education not found' });
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
