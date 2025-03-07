import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/db';
import { User, Post, Comment } from '@/models/schema';
import jwt from 'jsonwebtoken';

// POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    await connectToDB();
    
    const actions: { [key: string]: (body: any) => Promise<any> } = {
      LOGIN,
      REGIST,
      CREATE_POST,
      UPDATE_POST,
      DELETE_POST,
      CREATE_COMMENT,
      DELETE_COMMENT,
      GET_USER_BY_ID,
      GET_POST_BY_ID,
    };
    
    const selectedAction = actions[action];
    if (!selectedAction) {
      return NextResponse.json({ error: 'Invalid action'}, { status: 400 });
    }

    return await selectedAction(body);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error'}, { status: 500 });
  }
}

// LOGIN
async function LOGIN(body: any) {
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing required fields'}, { status: 400 });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password'}, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password'}, { status: 401 });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: '2d',
    });
    return NextResponse.json(
      { message: 'Login successful', token, username: user.username, email: user.email},
      { status: 200 }
    );
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Error logging in'}, { status: 500 });
  }
}

// REGISTER
async function REGIST(body: any) {
  const { username, email, password } = body;
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields'}, { status: 400 });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already in use'}, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date(),
    });
    await newUser.save();

    return NextResponse.json({ message: 'User registered successfully'}, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Error creating user'}, { status: 500 });
  }
}

// CREATE_POST
const CREATE_POST = async (body: any) => {
  const { title, content, token, category } = body;

  if (!title || !content || !token || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as jwt.JwtPayload).id;
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!Array.isArray(content) || content.length === 0) {
      return NextResponse.json({ error: 'Invalid content format' }, { status: 400 });
    }

    const newPost = new Post({
      userId,
      title,
      content,
      category,
      createdAt: new Date(),
    });
    
    await newPost.save();

    await User.findByIdAndUpdate(userId, {
      $push: { posts: newPost._id },
    });
    
    return NextResponse.json({ message: 'Post created successfully', post: newPost }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    const errorMessage = (error as Error).message;
    return NextResponse.json({ error: `Error creating post: ${errorMessage}` }, { status: 500 });
  }
};

// UPDATE_POST
const UPDATE_POST = async (body: any) => {
  const { postId, title, content, token, category } = body;

  if (!postId || !title || !content || !token || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as jwt.JwtPayload).id;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!Array.isArray(content) || content.length === 0) {
      return NextResponse.json({ error: 'Invalid content format' }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    post.title = title;
    post.content = content;
    post.category = category;
    post.updatedAt = new Date();

    await post.save();

    return NextResponse.json({ message: 'Post updated successfully', post }, { status: 200 });
  } catch (error) {
    console.error('Error updating post:', error);
    const errorMessage = (error as Error).message;
    return NextResponse.json({ error: `Error updating post: ${errorMessage}` }, { status: 500 });
  }
};


// DELETE_POST
async function DELETE_POST(body: any) {
  const { postId, token } = body;
  
  if (!postId || !token) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as jwt.JwtPayload).id;
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
    }

    await Comment.deleteMany({ postId: postId });

    await User.findByIdAndUpdate(userId, {
      $pull: { posts: postId }
    });
    await Post.findByIdAndDelete(postId);

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Error deleting post' }, { status: 500 });
  }
}


// CREATE_COMMENT
async function CREATE_COMMENT(body: any) {
  const { content, token, postId } = body;
  if (!content || !token || !postId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as jwt.JwtPayload).id;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const newComment = new Comment({
      userId,
      postId,
      content,
      createdAt: new Date(),
    });
    
    await newComment.save();
    await User.findByIdAndUpdate(userId, {
      $push: { comments: newComment._id },
    });

    await Post.findByIdAndUpdate(postId, {
      $push: { comments: newComment._id },
    });

    return NextResponse.json({ message: 'Comment created successfully', comment: newComment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 });
  }
}

// DELETE_COMMENT
async function DELETE_COMMENT(body: any) {
  const { postId, commentId, token } = body;
  
  if (!commentId || !token) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as jwt.JwtPayload).id;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'The specified comment could not be found or has already been deleted' }, { status: 404 });
    }
    if (comment.userId.toString() !== userId) {
      return NextResponse.json({ error: 'You not authorized to delete this comment' }, { status: 403 });
    }

    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { comments: commentId }
    });
    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error deleting comment' }, { status: 500 });
  }
}

// GET_USER_BY_ID
async function GET_USER_BY_ID(body: any) {
  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId'}, { status: 400 });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found'}, { status: 404 });
    }
    return NextResponse.json({ user}, { status: 200 });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return NextResponse.json({ error: 'Error fetching user by ID'}, { status: 500 });
  }
}

// GET_POST_BY_ID
async function GET_POST_BY_ID(body: any) {
  const { postId } = body;
  if (!postId) {
    return NextResponse.json({ error: 'Missing postId'}, { status: 400 });
  }

  try {
    const post = await Post.findById(postId).populate('userId').populate('comments').populate({
      path: 'comments',
      populate: { path: 'userId' },
    });
    if (!post) {
      return NextResponse.json({ error: 'Post not found'}, { status: 404 });
    }

    return NextResponse.json({ post}, { status: 200 });
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return NextResponse.json({ error: 'Error fetching post by ID'}, { status: 500 });
  }
}

// GET
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action');
    await connectToDB();
    
    const actions: { [key: string]: (req: NextRequest) => Promise<any> } = {
      GET_USERS,
      GET_POSTS,
    };
    
    const selectedAction = actions[action!];
    if (!selectedAction) {
      return NextResponse.json({ error: 'Invalid action'}, { status: 400 });
    }

    return await selectedAction(req);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error'}, { status: 500 });
  }
}

// GET_ALL_USERS
async function GET_USERS(req: NextRequest) {
  try {
    const users = await User.find();
    return NextResponse.json({ users}, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error fetching users'}, { status: 500 });
  }
}

// GET_ALL_POSTS
async function GET_POSTS(req: NextRequest) {
  try {
    const searchQuery = req.nextUrl.searchParams.get('query') || '';

    const posts = await Post.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } }
      ]
    })
      .populate('userId')
      .populate('comments')
      .populate({
        path: 'comments',
        populate: { 
          path: 'userId', populate:{path: 'username'} },
      })
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ posts}, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Error fetching posts'}, { status: 500 });
  }
}
