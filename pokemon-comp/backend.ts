import express from 'express';
import cors from 'cors';
import supabase from './supabaseClient.ts';
import supabaseAdmin from './supabaseAdmin.ts';


const PORT = 8000;
const app = express();



app.use(cors({ origin: 'http://localhost:5173' })) 
app.use(express.json())  

//test methid
app.get('/', (req, res) => {
    res.json({ message: 'Hello, World!' });
});


//signup user to supabase database. Logs data in both Auth and users tables
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


//edits old username into new username submited by client
app.patch('/user/username', async(req, res) => {
    //verify the user is logged in
    
    //Bearer is a default header that comes before token in Supabase, thus it needs to be cleansed off the token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if(!token) {
        return res.status(401).json({error: "Not logged in"});
    }

    //check if session is a valid one
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if(authError || !user){
        return res.status(401).json({ error: "Invalid session"});
    }

    //check if username meets minimum criteria
    const { username } = req.body;
    if(typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({error: 'Username must be at least 3 characters long.'});
    }
    const cleanedData = username.trim();

    //update user row
    const { error } = await supabaseAdmin
        .from('users')
        .update({username: cleanedData})
        .eq('id', user.id);

    //send error if username failed to update
    if(error){
        console.error('Error updating username:', error);
        return res.status(400).json({error: error.message});
    }

    //send json data
    res.json({username: cleanedData})
});



//starts server on backend port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
