const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://phil-ai-project-yefr.vercel.app',
    'https://philai-project-2.onrender.com'
  ]
}));
app.use(express.json());

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})