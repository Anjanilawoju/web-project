const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const methodOverride = require('method-override');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    connectionLimit: 10
});

// Setup script to create database and table if they don't exist
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database: ' + err.stack);
        return;
    }

    // Create the database if it doesn't exist
    connection.query('CREATE DATABASE IF NOT EXISTS recipe', (err) => {
        if (err) {
            console.error('Error creating database: ' + err.stack);
            connection.release();
            return;
        }
        // Use the recipe database
        connection.query('USE recipe', (err) => {
            if (err) {
                console.error('Error using database: ' + err.stack);
                connection.release();
                return;
            }

            // Create the recipelist table if it doesn't exist
            connection.query(`
                CREATE TABLE IF NOT EXISTS recipelist (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    recipe_title VARCHAR(255) NOT NULL,
                    ingredient TEXT,
                    instructions TEXT
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating table: ' + err.stack);
                } else {
                    console.log('Database and table are ready');
                }

                // Release the connection
                connection.release();
            });
        });
    });
});

app.get('/', (req, res) => {
    res.send(' Food Home Page');
});

app.get('/create-recipe', (req, res) => {
    res.send('Hi This is Food Home Page');
});

app.post('/submit-recipe', (req, res) => {
    const { recipeTitle, ingredients, instructions } = req.body;
    console.log(recipeTitle);

    const sql = 'INSERT INTO recipelist (recipe_title, ingredient, instructions) VALUES (?, ?, ?)';
    pool.query(sql, [recipeTitle, ingredients, instructions], (err, result) => {
        if (err) {
            console.error('Error adding new recipe: ' + err.stack);
            res.status(500).json({ message: 'Error adding new recipe' });
            return;
        }
        console.log('New recipe added to the database');
        res.json({ status: 200, message: 'Recipe added successfully' });
    });
});

app.get('/getRecipes', (req, res) => {
    const sql = 'SELECT * FROM recipelist';
    pool.query(sql, async (err, results) => {
        if (err) {
            console.error('Error retrieving recipes: ' + err.stack);
            res.status(500).json({ message: 'Error retrieving recipes' });
            return;
        }
        res.json(results);
    });
});

app.get('/getRecipe/:id', (req, res) => {
    const recipeId = req.params.id;
    const sql = 'SELECT * FROM recipelist WHERE id = ?';
    pool.query(sql, [recipeId], (err, results) => {
        if (err) {
            console.error('Error retrieving recipe: ' + err.stack);
            res.status(500).json({ message: 'Error retrieving recipe' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ message: 'Recipe not found' });
        } else {
            res.json(results[0]);
        }
    });
});

app.post('/update-recipe/:id', (req, res) => {
    const recipeId = req.params.id;
    const { editTitle, editIngredients, editInstructions } = req.body;

    if (!editTitle) {
        return res.status(400).json({ message: 'Recipe title cannot be null or empty' });
    }

    const sql = 'UPDATE recipelist SET recipe_title = ?, ingredient = ?, instructions = ? WHERE id = ?';
    pool.query(sql, [editTitle, editIngredients, editInstructions, recipeId], (err, result) => {
        if (err) {
            console.error('Error updating recipe: ' + err.stack);
            res.status(500).json({ message: 'Error updating recipe' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Recipe not found' });
        } else {
            res.json({ message: 'Recipe updated successfully' });
        }
    });
});

// Delete a recipe by ID
app.delete('/delete-recipe/:id', (req, res) => {
    const recipeId = req.params.id;

    const sql = 'DELETE FROM recipelist WHERE id = ?';
    pool.query(sql, [recipeId], (err, result) => {
        if (err) {
            console.error('Error deleting recipe: ' + err.stack);
            res.status(500).json({ message: 'Error deleting recipe' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Recipe not found' });
        } else {
            res.json({ message: 'Recipe deleted successfully' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
