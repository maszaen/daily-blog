import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/db';
import { User, Post } from '@/models/schema'; // Assuming your models are in schema.js
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    await connectToDB();

    // IMPORT ACTIONS
    const actions: { [key: string]: (body: any) => Promise<any> } = {
      LOGIN,
      REGIST,
      GET_USERS,
      GET_POSTS,
      GET_USER_BY_ID,
      CREATE_POST,
      GET_POST_BY_ID,
    };
    const selectedAction = actions[action];
    if (!selectedAction) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return selectedAction(body);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET_USER_BY_ID
async function GET_USER_BY_ID(body: any) {
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return NextResponse.json({ error: 'Error fetching user by ID' }, { status: 500 });
  }
}

// Function to get all users
async function GET_USERS() {
  try {
    const users = await User.find();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

// LOGIN
async function LOGIN(body: any) {
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: '2d',
    });
    return NextResponse.json(
      { message: 'Login successful', token, username: user.username, email: user.email },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Error logging in' }, { status: 500 });
  }
}

// REGISTER
async function REGIST(body: any) {
  const { username, email, password } = body;
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
 
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isAsmin: false,
      createdAt: new Date(),
    });
    await newUser.save();

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
  }
}

// GET ALL POSTS
async function GET_POSTS() {
  try {
    const posts = await Post.find().populate('userId').populate('comments');
    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
  }
}

// CREATE_POST
async function CREATE_POST(body: any) {
  const { title, content, token } = body;

  if (!title || !content || !token) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as jwt.JwtPayload).id;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const newPost = new Post({
      userId,
      title,
      content,
      comments: [],
      createdAt: new Date(),
    });
    await newPost.save();

    return NextResponse.json({ message: 'Post created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Error creating post' }, { status: 500 });
  }
}

// GET_POST_BY_ID
async function GET_POST_BY_ID(body: any) {
  const { postId } = body;

  if (!postId) {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
  }
  try {
    const post = await Post.findById(postId).populate('userId').populate('comments');
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return NextResponse.json({ error: 'Error fetching post by ID' }, { status: 500 });
  }
}

