import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';

const PORT = 8000;
const app = express();

app.use(cors({ origin: 'http://localhost:5173' })) 
app.use(express.json())  

app.get('/', (req, res) => {
    res.json({ message: 'Hello, World!' });
});



app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    res.json({ message: 'Login successful' });
});

app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    console.log('Signup attempt:', { username, email, password });
    res.json({ message: 'Signup successful' });
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
