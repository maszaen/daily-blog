import mongoose, { Schema, Document } from 'mongoose';

interface IContentItem {
  text: string;
  isBold: boolean;
  alignment: 'left' | 'center' | 'right';
}

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  bio: string;
  isAdmin: boolean;
  comments: Schema.Types.ObjectId[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, required: false },
  isAdmin: { type: Boolean, default: false },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

interface IComment extends Document {
  userId: Schema.Types.ObjectId;
  postId: Schema.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const CommentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

interface IPost extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  content: IContentItem[];
  category: string;
  comments: Schema.Types.ObjectId[];
  createdAt: Date;
}

const PostSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: [{
    alignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
    segments: [{
      isBold: { type: Boolean, default: false },
      text: { type: String, required: true },
    }],
  }],
  category: { type: String, required: true },
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now },
});

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
