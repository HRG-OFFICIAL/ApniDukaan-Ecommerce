import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://userservice-dev:eKtnLTAnmTlPVM9H@cluster0.0ezsixh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

export async function GET(request: NextRequest) {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db("apnidukaan");
    const categories = db.collection("categories");
    
    // Get all active categories sorted by sortOrder
    const allCategories = await categories
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      categories: allCategories,
      total: allCategories.length
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        categories: [],
        total: 0
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  const client = new MongoClient(uri);
  
  try {
    const body = await request.json();
    await client.connect();
    const db = client.db("apnidukaan");
    const categories = db.collection("categories");
    
    // Create new category
    const newCategory = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };
    
    const result = await categories.insertOne(newCategory);
    
    return NextResponse.json({
      success: true,
      category: { ...newCategory, _id: result.insertedId }
    });
    
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
