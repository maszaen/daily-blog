import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/db';
import { User, Post } from '@/models/schema';
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
      GET_USER_BY_ID,
      GET_POST_BY_ID,
    };
    
    const selectedAction = actions[action];
    if (!selectedAction) {
      return NextResponse.json({ error: 'Invalid action', conn: false, act: false }, { status: 400 });
    }

    return await selectedAction(body);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error', conn: false, act: false }, { status: 500 });
  }
}

// LOGIN
async function LOGIN(body: any) {
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing required fields', conn: false, act: false }, { status: 400 });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password', conn: false, act: false }, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password', conn: false, act: false }, { status: 401 });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: '2d',
    });
    return NextResponse.json(
      { message: 'Login successful', token, username: user.username, email: user.email, conn: false, act: false },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Error logging in', conn: false, act: false }, { status: 500 });
  }
}

// REGISTER
async function REGIST(body: any) {
  const { username, email, password } = body;
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields', conn: false, act: false }, { status: 400 });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already in use', conn: false, act: false }, { status: 400 });
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

    return NextResponse.json({ message: 'User registered successfully', conn: false, act: false }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Error creating user', conn: false, act: false }, { status: 500 });
  }
}

// CREATE_POST
async function CREATE_POST(body: any) {
  const { title, content, token, category } = body;

  if (!title || !content || !token) {
    return NextResponse.json({ error: 'Missing required fields', conn: false, act: false }, { status: 400 });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as jwt.JwtPayload).id;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Access denied', conn: false, act: false }, { status: 403 });
    }

    const newPost = new Post({
      userId,
      title,
      content,
      category,
      comments: [],
      createdAt: new Date(),
    });
    await newPost.save();

    return NextResponse.json({ message: 'Post created successfully', conn: false, act: false }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Error creating post', conn: false, act: false }, { status: 500 });
  }
}

// GET_USER_BY_ID
async function GET_USER_BY_ID(body: any) {
  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId', conn: false, act: false }, { status: 400 });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found', conn: false, act: false }, { status: 404 });
    }
    return NextResponse.json({ user, conn: false, act: false }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return NextResponse.json({ error: 'Error fetching user by ID', conn: false, act: false }, { status: 500 });
  }
}

// GET_POST_BY_ID
async function GET_POST_BY_ID(body: any) {
  const { postId } = body;

  if (!postId) {
    return NextResponse.json({ error: 'Missing postId', conn: false, act: false }, { status: 400 });
  }

  try {
    const post = await Post.findById(postId).populate('userId').populate('comments');
    if (!post) {
      return NextResponse.json({ error: 'Post not found', conn: false, act: false }, { status: 404 });
    }

    return NextResponse.json({ post, conn: false, act: false }, { status: 200 });
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return NextResponse.json({ error: 'Error fetching post by ID', conn: false, act: false }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid action', conn: false, act: false }, { status: 400 });
    }

    return await selectedAction(req);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error', conn: false, act: false }, { status: 500 });
  }
}

// GET_ALL_USERS
async function GET_USERS(req: NextRequest) {
  try {
    const users = await User.find();
    return NextResponse.json({ users, conn: false, act: false }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error fetching users', conn: false, act: false }, { status: 500 });
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
      .sort({ createdAt: -1 });

    return NextResponse.json({ posts, conn: false, act: false }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Error fetching posts', conn: false, act: false }, { status: 500 });
  }
}
