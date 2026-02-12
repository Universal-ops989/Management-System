import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { USER_GROUP_VALUES, DEFAULT_USER_GROUP } from '../constants/groups.js';
import { DEGREE_VALUES, getDegreeDisplayName } from '../constants/roles.js';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  group: {
    type: String,
    enum: USER_GROUP_VALUES,
    default: DEFAULT_USER_GROUP,
    required: true
  },
  degree: {
    type: String,
    enum: DEGREE_VALUES,
    default: 'MEMBER',
    required: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'GUEST', 'BOSS'], // BOSS kept for backward compatibility
    default: 'MEMBER',
    required: true
  },
  editor: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'disabled', 'pending'],
    default: 'pending',
    required: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if passwordHash is modified
  if (!this.isModified('passwordHash')) return next();
  
  // Skip if passwordHash is empty (shouldn't happen due to required, but safety check)
  if (!this.passwordHash) {
    return next();
  }
  
  // Check if already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$') || this.passwordHash.startsWith('$2y$')) {
    return next();
  }
  
  // Hash the password
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to get user summary (without passwordHash)
userSchema.methods.toSummary = function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    group: this.group,
    degree: this.degree,
    degreeLabel: getDegreeDisplayName(this.degree),
    role: this.role,
    editor: this.editor,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export default mongoose.model('User', userSchema);

