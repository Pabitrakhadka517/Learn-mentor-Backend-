# Profile Update Error Fix Documentation

## Backend Service Update

```typescript
// src/modules/profile/profile.service.ts

export class ProfileService {
    static async updateProfile(
        userId: string,
        dto: UpdateProfileDTO,
        file?: Express.Multer.File
    ): Promise<ProfileResponseDTO> {
        try {
            // Validate DTO
            const validated = UpdateProfileDTOSchema.parse(dto);
            
            // Get current user
            const currentUser = await ProfileRepository.findById(userId);
            if (!currentUser) {
                throw new Error('User not found');
            }

            // Email uniqueness validation - NEW FIX
            if (validated.email && validated.email !== currentUser.email) {
                const emailExists = await ProfileRepository.findByEmail(validated.email);
                if (emailExists && emailExists._id.toString() !== userId) {
                    throw new Error('Email already exists. Please use a different email address.');
                }
            }

            // Password validation if changing password
            if (validated.newPassword && validated.oldPassword) {
                const isCurrentPasswordValid = await bcrypt.compare(
                    validated.oldPassword,
                    currentUser.passwordHash
                );
                
                if (!isCurrentPasswordValid) {
                    throw new Error('Current password is incorrect');
                }
                
                validated.passwordHash = await bcrypt.hash(validated.newPassword, 12);
            }

            // Handle file upload if present
            let profileImageUrl = currentUser.profileImage;
            if (file) {
                // Delete old image if exists
                if (currentUser.profileImage) {
                    const publicId = this.extractPublicId(currentUser.profileImage);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                    }
                }

                // Upload new image
                const uploadResult = await cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    {
                        folder: 'learnmentor/profiles',
                        transformation: [
                            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                            { quality: 'auto', fetch_format: 'auto' }
                        ]
                    }
                );

                profileImageUrl = uploadResult.secure_url;
            }

            // Prepare update data
            const updateData: any = {
                fullName: validated.name,
                phone: validated.phone,
                speciality: validated.speciality,
                address: validated.address,
                email: validated.email, // Now safe to update
            };

            if (profileImageUrl !== currentUser.profileImage) {
                updateData.profileImage = profileImageUrl;
            }

            if (validated.passwordHash) {
                updateData.passwordHash = validated.passwordHash;
            }

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            // Update user with proper error handling
            const updatedUser = await ProfileRepository.update(userId, updateData);

            // Handle tutor-specific updates
            if (updatedUser.role === 'TUTOR' && 
                (validated.bio || validated.hourlyRate || validated.experienceYears || 
                 validated.subjects || validated.languages)) {
                
                const tutorUpdateData: any = {};
                
                if (validated.bio !== undefined) tutorUpdateData.bio = validated.bio;
                if (validated.hourlyRate !== undefined) tutorUpdateData.hourlyRate = validated.hourlyRate;
                if (validated.experienceYears !== undefined) tutorUpdateData.experienceYears = validated.experienceYears;
                if (validated.subjects !== undefined) tutorUpdateData.subjects = validated.subjects;
                if (validated.languages !== undefined) tutorUpdateData.languages = validated.languages;

                await TutorProfile.findOneAndUpdate(
                    { user: userId },
                    tutorUpdateData,
                    { new: true, upsert: true }
                );
            }

            return this.getProfile(userId);
            
        } catch (error: any) {
            // Enhanced error handling
            if (error.code === 11000) {
                if (error.keyPattern?.email) {
                    throw new Error('Email already exists. Please use a different email address.');
                }
                throw new Error('Duplicate data detected. Please check your information.');
            }
            
            throw error;
        }
    }
}
```

## Repository Layer Enhancement

```typescript
// src/modules/profile/profile.repository.ts

export class ProfileRepository {
    static async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email: email.toLowerCase() });
    }

    static async update(userId: string, updateData: Partial<IUser>): Promise<IUser> {
        // Use findByIdAndUpdate with proper options
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                ...updateData,
                updatedAt: new Date()
            },
            { 
                new: true,
                runValidators: true,
                context: 'query' // Important for proper validation
            }
        );

        if (!updatedUser) {
            throw new Error('User not found');
        }

        return updatedUser;
    }
}
```

## Controller Layer Error Handling

```typescript
// src/modules/profile/profile.controller.ts

export class ProfileController {
    static async updateProfile(req: any, res: Response) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const updatedProfile = await ProfileService.updateProfile(
                req.user.userId,
                req.body,
                req.file
            );

            res.status(200).json({
                message: 'Profile updated successfully',
                profile: updatedProfile
            });

        } catch (error: any) {
            console.error('Profile update error:', error);

            // Specific error handling for duplicate key
            if (error.message.includes('Email already exists')) {
                return res.status(409).json({ 
                    error: 'Conflict',
                    message: error.message,
                    field: 'email'
                });
            }

            if (error.message.includes('Current password is incorrect')) {
                return res.status(400).json({
                    error: 'Invalid password',
                    message: error.message,
                    field: 'oldPassword'
                });
            }

            if (error instanceof z.ZodError) {
                const errors = error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors
                });
            }

            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to update profile. Please try again.'
            });
        }
    }
}
```

## Database Index Management

```javascript
// MongoDB Commands to run in MongoDB shell

// Check existing indexes
db.users.getIndexes()

// Ensure email index is properly configured
db.users.createIndex(
    { "email": 1 }, 
    { 
        "unique": true, 
        "sparse": true,
        "collation": { "locale": "en", "strength": 2 }
    }
)

// Create compound index for better query performance
db.users.createIndex(
    { "email": 1, "role": 1, "isActive": 1 }
)
```

## Frontend Error Handling

```typescript
// Frontend service update
export const profileService = {
    async updateProfile(profileData: any, file?: File) {
        try {
            const formData = new FormData();
            
            // Append profile data
            Object.keys(profileData).forEach(key => {
                if (profileData[key] !== undefined && profileData[key] !== '') {
                    formData.append(key, profileData[key]);
                }
            });
            
            if (file) {
                formData.append('profileImage', file);
            }

            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    // Don't set Content-Type for FormData
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific error types
                if (response.status === 409 && data.field === 'email') {
                    throw new Error('This email is already in use. Please choose a different email.');
                }
                if (response.status === 400 && data.field === 'oldPassword') {
                    throw new Error('Current password is incorrect.');
                }
                throw new Error(data.message || 'Failed to update profile');
            }

            return data;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }
};
```

## Testing Instructions

### Unit Tests

```typescript
// tests/profile.service.test.ts

describe('ProfileService', () => {
    describe('updateProfile', () => {
        it('should prevent duplicate email updates', async () => {
            // Create two users
            const user1 = await createTestUser('user1@test.com');
            const user2 = await createTestUser('user2@test.com');

            // Try to update user2 with user1's email
            await expect(
                ProfileService.updateProfile(user2.id, { email: 'user1@test.com' })
            ).rejects.toThrow('Email already exists');
        });

        it('should allow user to keep their own email', async () => {
            const user = await createTestUser('user@test.com');
            
            const result = await ProfileService.updateProfile(user.id, {
                email: 'user@test.com',
                name: 'Updated Name'
            });

            expect(result.email).toBe('user@test.com');
            expect(result.name).toBe('Updated Name');
        });
    });
});
```

### Integration Tests

```javascript
// API endpoint testing
const testEmailDuplication = async () => {
    // Test 1: Create user with email
    const response1 = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@example.com',
            password: 'SecurePass123!',
            fullName: 'Test User 1'
        })
    });

    // Test 2: Try to update another user with same email
    const response2 = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + otherUserToken 
        },
        body: JSON.stringify({
            email: 'test@example.com'
        })
    });

    console.assert(response2.status === 409, 'Should return conflict error');
};
```

## Security Considerations

1. **Input Validation**: All email inputs are validated and sanitized
2. **Case Sensitivity**: Email comparisons are case-insensitive
3. **Rate Limiting**: Implement rate limiting on profile update endpoints
4. **Audit Logging**: Log all profile update attempts for security monitoring

## Deployment Checklist

- [ ] Update backend service code
- [ ] Run database index updates
- [ ] Deploy backend changes
- [ ] Update frontend error handling
- [ ] Run integration tests
- [ ] Monitor error logs for 24 hours post-deployment