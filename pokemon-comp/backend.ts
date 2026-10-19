import express from 'express';
import cors from 'cors';
import supabase from './supabaseClient.ts';
import supabaseAdmin from './supabaseAdmin.ts';
import  makeVerifierClient  from './supabaseVerifier.ts';
import { validateEmail, validatePassword} from './src/lib/validation.ts'
import { error } from 'console';


const PORT = 8000;
const app = express();



app.use(cors({ origin: 'http://localhost:5173' })) 
app.use(express.json())  

//test methid
app.get('/', (req, res) => {
    res.json({ message: 'Hello, World!' });
});


/**
 * USER DATA CALLS
 */

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


//updates old email and/or password
app.patch('/user/credentials', async (req,res ) => {
    //verify user is logged in
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Not logged in.' });
    }
    
    //check if session is valid
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if(authError || !user){
        return res.status(401).json({ error: 'Invalid session' });
    }
    //check what the user is attempting to update
    const { currentPassword, newEmail, newPassword } = req.body;

    const cleanEmail = typeof newEmail === 'string' ? newEmail.trim().toLowerCase() : '';
    const emailChanging = cleanEmail !== '' && cleanEmail !== user.email?.toLowerCase();
    const passwordChanging = typeof newPassword === 'string' && newPassword.length > 0;

    if(!emailChanging && !passwordChanging) {
        return res.status(400).json({ error: 'Nothing to change' });
    }

    if(typeof currentPassword !== 'string' || currentPassword === ''){
        return res.status(400).json({ error: 'Current password required' });
    }

    if(emailChanging){
        const emailError = validateEmail(cleanEmail);
        if (emailError) return res.status(400).json({ error: emailError });
    }

    if(passwordChanging) {
        const passwordError = validatePassword(newPassword);
        if (passwordError) return res.status(400).json({ error: passwordError });
    }

    //check if current password is correct
    const { error: verifyError } = await makeVerifierClient().auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
    });
    if(verifyError){
        return res.status(403).json({ error: 'Current password is incorrect' });
    }
    
    //update supababse auth
    const updates: { email?: string; password?: string; email_confirm?: boolean } = {};
    if(emailChanging) {
        updates.email = cleanEmail;
        updates.email_confirm = true;
    }
    if(passwordChanging) {
        updates.password = newPassword;
    }

    const {error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, updates);
    if(updateError){
        console.error('Error updating credentials:', updateError);
        return res.status(400).json({ error: updateError.message });
    }

    //update users table to sync with Subabase Auth
    if(emailChanging){
        const { error: tableError } = await supabaseAdmin
            .from('users')
            .update({email: cleanEmail })
            .eq('id', user.id);

        if(tableError) {
            console.error('Auth email changed but users table update failed:', tableError);
        }
    }

    //sign user out of all sessions
    await supabaseAdmin.auth.admin.signOut(token);

    res.json({ message: 'Credentials updated. Please sign in again' });
});


/**
 * POKEMON DATA CALLS
 */

//creates new empty team for logged in user if requested
app.post('/teams', async(req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if(!token) return res.status(401).json({error:'Not Logged In'});

    const { data: {user}, error: authError } = await supabaseAdmin.auth.getUser(token);
    if(authError || !user) return res.status(401).json({error:'Invalid Session'});

    const now = new Date().toISOString();
    const {data, error} = await supabaseAdmin
        .from('teams')
        .insert({
            user_id: user.id,
            name: 'New Team',
            created_at: now,
            updated_at: now
        })
        .select()
        .single();
    
    if(error){
        console.error('Error creating team: ', error);
        return res.status(400).json({error: error.message});
    }

    res.json(data);
});


//get teams owned by logged in user
app.get('/teams', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if(!token) return res.status(401).json({error:'Not Logged In'});

    const { data: {user}, error: authError } = await supabaseAdmin.auth.getUser(token);
    if(authError || !user) return res.status(401).json({error:'Invalid Session'});

    const {data, error} = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', {ascending: false});
    
    if(error){
        console.error('Error getting team: ', error);
        return res.status(400).json({error: error.message});
    }

    res.json(data);
});

//deletes one of the logged in user's teams
app.delete('/teams/:id', async(req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if(!token) return res.status(401).json({error:'Not Logged In'});

    const { data: {user}, error: authError } = await supabaseAdmin.auth.getUser(token);
    if(authError || !user) return res.status(401).json({error:'Invalid Session'});

    const {data, error} = await supabaseAdmin
        .from('teams')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', user.id)
        .select();
    
    if(error){
        console.error('Error deleting team: ', error);
        return res.status(400).json({error: error.message});
    }

    //nothing deleted means the team doesn't exist or belongs to someone else
    if(!data || data.length === 0){
        return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ message: 'Team deleted' });

});

//gets one of the logged in user.s team along with the pokemon
app.get('/teams/:id', async(req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if(!token) return res.status(401).json({error:'Not Logged In'});

    const { data: {user}, error: authError } = await supabaseAdmin.auth.getUser(token);
    if(authError || !user) return res.status(401).json({error:'Invalid Session'});

    const {data, error} = await supabaseAdmin
        .from('teams')
        .select('*, team_pokemon(*)')
        .eq('id', req.params.id)
        .eq('user_id', user.id)
        .single();
    
    if(error || !data){
        return res.status(404).json({ error: 'Team not found' });
    }

    res.json(data);
})

//saves a team's name and all its pokemon in one go
app.put('/teams/:id', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if(!token) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if(authError || !user){
        return res.status(401).json({ error: 'Invalid session' });
    }

    const {name,pokemon} = req.body;
    if(typeof name !== 'string' || name.trim().length === 0){
        return res.status(400).json({error: 'Team name is required'});
    }

    const validPokemon = Array.isArray(pokemon)
        && pokemon.length <= 6 //are 6 or less pokemon being sent
        && pokemon.every((p: any) =>
            Number.isInteger(p.slot) && p.slot >= 0 && p.slot <= 5 && Number.isInteger(p.species_id)) //are the slots between 0-5, and is slot and species id an int
        && new Set(pokemon.map((p: any) => p.slot)).size === pokemon.length; //did any two or more pokemon claim the same slot
    if(!validPokemon){
        return res.status(400).json({error:'Invalid Pokemon Data'});
    }

    //double chcek team is owned by logged in user
    const {data: team, error: teamError} = await supabaseAdmin
        .from('teams')
        .select('id')
        .eq('id', req.params.id)
        .eq('user_id', user.id)
        .single();
    if(teamError || !team){
        return res.status(404).json({error:'Team not found'});
    }

    //nature, ability, gender, shiny, and evs to be added later
    const rows = pokemon.map((p: any) => ({
        team_id: req.params.id,
        slot: p.slot,
        species_id: p.species_id,
        item: p.item ?? null,
        move1: p.moves?.[0] ?? null,
        move2: p.moves?.[1] ?? null,
        move3: p.moves?.[2] ?? null,
        move4: p.moves?.[3] ?? null
    }));

    //insert new slots / update existing ones (unique on team_id + slot)
    if(rows.length > 0){
        const {error: upsertError} = await supabaseAdmin
            .from('team_pokemon')
            .upsert(rows, {onConflict: 'team_id,slot'});
        if(upsertError){
            console.error('Error saving pokemon:', upsertError);
            return res.status(400).json({error: upsertError.message});
        }
    }

    //remove pokemon from any slot the user emptied
    let removeQuery = supabaseAdmin.from('team_pokemon').delete().eq('team_id', req.params.id);
    if(rows.length > 0){
        removeQuery = removeQuery.not('slot', 'in', `(${rows.map((r: any) => r.slot).join(',')})`);
    }

    const {error: removeError} = await removeQuery;
    if(removeError){
        console.error('Error removing pokemon:', removeError);
        return res.status(400).json({error: removeError.message});
    }

    //update the name and the modified date
    const {error: updateError} = await supabaseAdmin
        .from('teams')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', req.params.id);
    
    if(updateError){
        console.error('Error updating team:', updateError);
        return res.status(400).json({error: updateError.message});
    }

    res.json({message: 'Team Saved'});
})



//starts server on backend port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
