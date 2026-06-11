import express from 'express';
import cors from 'cors';
import supabase from './supabaseClient.ts';


const PORT = 8000;
const app = express();



app.use(cors({ origin: 'http://localhost:5173' })) 
app.use(express.json())  

app.get('/', (req, res) => {
    res.json({ message: 'Hello, World!' });
});


app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPass } = req.body;
    
    //supabase auth creates user and hashes password
    const {data, error} = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        console.error('Error signing up:', error);
        return res.status(400).json({ message: 'Signup failed', error: error.message });
    }
    console.log('Auth user created: ', data.user?.id);

    //insert data into users table
    const {error: insertError} = await supabase
        .from('users')
        .insert({
            id: data.user?.id,
            username: username,
            email: email
        });

    if (insertError) {
        console.error('Error inserting user data:', insertError);
        return res.status(400).json({ message: 'Signup failed', error: insertError.message });
    }

    console.log('Signup attempt:', { username, email, password });
    res.json({ message: 'Signup successful' });
});





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
