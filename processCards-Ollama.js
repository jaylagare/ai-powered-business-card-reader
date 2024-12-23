// Import required modules
const axios = require('axios'); // For making HTTP requests
const fs = require('fs').promises; // For handling files asynchronously
const path = require('path'); // For working with file paths

// Ollama API endpoint
const OLLAMA_API_URL = "http://localhost:11434/api/chat";

// Check if file is an image
function isImageFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext); // Adjust extensions as needed
}

// Send the image and prompt to Ollama
async function processImageFile(filePath) {
    try {
        // Read the image content as base64 encoded string
        const imageBuffer = await fs.readFile(filePath);
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        // Prepare the request payload
        const payload = {
            "model": "llama3.2-vision",
            "stream": false,
            "messages": [
                {
                    "role": "user",
                    "content": "Identify the contact's name, title, email address, phone number, company name, industry, and website and output in a comma-delimited string.",
                    images: [base64Image],
                }
            ]
        };

        // Send the request to Ollama
        const response = await axios.post(OLLAMA_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const content = response.data.message.content;

        return content;
    } catch (error) {
        console.error("Error processing image:", error.message);
    }
}

// Append the result from Ollama to a CSV file
async function appendToFile(filePath, content) {
    try {
        await fs.appendFile(filePath, content + '\n', 'utf8');
        console.log('Content appended successfully!');
    } catch (err) {
        console.error('Error appending content:', err);
    }
}

// Go through each file in the folder
async function processFolder(folderPath) {
    try {
        const files = await fs.readdir(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);

            if (isImageFile(filePath)) {
                const extractedData = await processImageFile(filePath);
                if (extractedData) {
                    await appendToFile('contacts.csv', extractedData);
                    console.log('Processed:', filePath);
                }
            } else {
                console.warn('Skipping non-image file:', filePath);
            }
        }
    } catch (error) {
        console.error('Error processing folder:', error);
    }
}

// Get the folder containing the business card image files.
const folderPath = process.argv[2];

if (!folderPath) {
    console.error("Please provide a folder path as an argument.");
    process.exit(1);
}

processFolder(folderPath);
