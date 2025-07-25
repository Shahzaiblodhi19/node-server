const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'drctsmsw4',
    api_key: '231138469193135',
    api_secret: 'ddcg3JyPkmsVRX67D0dGy4Zi9aQ', // Replace this with your actual secret
});

// Initialize express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse incoming JSON requests
// Route to show "Hello" at the main URL
app.get('/', (req, res) => {
    res.send('Hello');
});


// Serve static files from 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect('mongodb+srv://Shahzaiblodhi2233:Shahzaib12212021@cluster0.hu3oq.mongodb.net/myDatabaseName?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
    });

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blogs',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0]
    },
});
const upload = multer({ storage });


// Blog Schema
const blogSchema = new mongoose.Schema({
    title: String,
    subHeading: String,
    image: String, // Store the file name
    date: String,
    description: String
});
const Blog = mongoose.model('Blog', blogSchema);


// API Routes

// Route to create a new blog
app.post('/api/blogs', upload.single('image'), async (req, res) => {
    try {
        const { title, subHeading, date, description } = req.body;
        const image = req.file ? req.file.path : null;

        const newBlog = new Blog({ title, subHeading, image, date, description });
        await newBlog.save();

        res.status(201).json({
            message: 'Blog created successfully',
            newBlog: {
                ...newBlog.toObject(),
                image: image, // Already full URL
            },
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to create blog' });
    }
});

// Route to get all blogs
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json(blogs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// Route to get a single blog
app.get('/api/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.status(200).json(blog);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blog' });
    }
});

// Route to delete a blog
app.delete('/api/blogs/:id', async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (!deletedBlog) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});
// Route to edit a blog
app.put('/api/blogs/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, subHeading, date, description } = req.body;
        const { id } = req.params;

        // Find the blog by ID
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Check if a new image is uploaded, and update the image field
        let image = blog.image; // Keep the existing image if no new one is uploaded
        if (req.file) {
            // Delete the old image file from the server if it's updated
            const fs = require('fs');
            image = req.file.path; // New URL
        }

        // Update the blog data
        blog.title = title || blog.title;
        blog.subHeading = subHeading || blog.subHeading;
        blog.date = date || blog.date;
        blog.description = description || blog.description;
        blog.image = image;

        // Save the updated blog
        await blog.save();

        // Send the response back with updated blog details
        res.status(200).json({
            message: 'Blog updated successfully',
            updatedBlog: {
                ...blog.toObject(),
                image: blog.image || null, // Already a full URL from Cloudinary
            }
        });


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update blog' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
