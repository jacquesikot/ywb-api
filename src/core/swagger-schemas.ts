/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the user
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         profilePicUrl:
 *           type: string
 *           description: URL to user's profile picture
 *         verified:
 *           type: boolean
 *           description: Whether user's email is verified
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (never returned in responses)
 *         username:
 *           type: string
 *           description: User's unique username
 *         type:
 *           type: string
 *           enum: [BUSINESS, CLIENT, FREELANCER]
 *           description: User type/role
 *         phone:
 *           type: string
 *           description: User's phone number
 *         bio:
 *           type: string
 *           description: User's biographical information
 *         location:
 *           type: string
 *           description: User's location
 *         companyRole:
 *           type: string
 *           description: User's role in their company
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of user's skills
 *         talentPoolPreferences:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of user's talent pool preferences
 *         experienceLevel:
 *           type: string
 *           description: User's experience level
 *         portfolioLinks:
 *           type: array
 *           items:
 *             type: string
 *           description: Links to user's portfolio
 *
 *     Job:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the job
 *         title:
 *           type: string
 *           description: Job title
 *         description:
 *           type: string
 *           description: Detailed job description
 *         category:
 *           type: string
 *           description: Job category
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of skills required for the job
 *         user:
 *           type: string
 *           description: ID of the user who posted the job
 *         budget:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [FIXED, HOURLY]
 *               description: Budget type
 *             value:
 *               type: number
 *               description: Budget amount (if fixed)
 *             min:
 *               type: number
 *               description: Minimum budget range (if range)
 *             max:
 *               type: number
 *               description: Maximum budget range (if range)
 *         locationPreference:
 *           type: string
 *           enum: [REMOTE, ONSITE, HYBRID]
 *           description: Job location preference
 *         type:
 *           type: string
 *           enum: [FULL_TIME, PART_TIME, CONTRACT, ONE_TIME]
 *           description: Job type
 *         status:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: Current job status
 *         timeline:
 *           type: string
 *           description: Expected timeline for job completion
 *         hoursPerWeek:
 *           type: number
 *           description: Hours of work required per week
 *         visibility:
 *           type: string
 *           enum: [PUBLIC, PRIVATE]
 *           description: Job visibility
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when job was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when job was last updated
 *
 *     Wave:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the wave
 *         job:
 *           type: string
 *           description: ID of the associated job
 *         freelancer:
 *           type: string
 *           description: ID of the freelancer who waved
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED]
 *           description: Status of the wave
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when wave was created
 *
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the chat
 *         job:
 *           type: string
 *           description: ID of the associated job
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of users participating in the chat
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 *           description: Messages in the chat
 *         wave:
 *           type: string
 *           description: ID of the associated wave
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when chat was created
 *
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the message
 *         chat:
 *           type: string
 *           description: ID of the associated chat
 *         sender:
 *           type: string
 *           description: ID of the user who sent the message
 *         content:
 *           type: string
 *           description: Message content
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when message was sent
 *         readBy:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of users who have read the message
 */
