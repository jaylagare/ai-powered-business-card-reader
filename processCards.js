const OpenAI = require("openai");
const fs = require("fs").promises;
const path = require("path");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function isImageFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext); // Adjust extensions as needed
}

async function processImageFile(filePath) {
    try {
        // Read the image content as base64 encoded string
        const imageBuffer = await fs.readFile(filePath);
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        // Send the base64 encoded image content to ChatGPT
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        // { type: "text", text: "What's in this image?" },
                        //{ type: "image", content: base64Image }, // Use "image" type
                        { 
                            type: "text", 
                            text: "identify the contact's name, title, email address, mobile/phone number, company name, industry (find out given the company), and website and output in a comma-delimited string" },
                        {
                            type: "image_url", 
                            image_url: 
                            {
                                url: "data:image/jpeg;base64,"+base64Image
                            }
                        }
                    ],
                },
            ],
        });

        // console.log(response.choices[0]);
        content = response.choices[0].message.content;
        console.log(content);

        return content;
    } catch (error) {
        console.error("Error processing image:", error);
    }
}

async function appendToFile(filePath, content) {
    try {
        await fs.appendFile(filePath, content, 'utf8');
        console.log('Content appended successfully!');
    } catch (err) {
        console.error('Error appending content:', err);
    }
}

async function processFolder(folderPath) {
    try {
        const files = await fs.readdir(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);

            if (isImageFile(filePath)) {
                const extractedData = await processImageFile(filePath);
                await appendToFile('contacts.csv', extractedData + '\n');
                console.log('Processed:', filePath);
            } else {
                console.warn('Skipping non-image file:', filePath);
            }
        }
    } catch (error) {
        console.error('Error processing folder:', error);
    }
}

// Get the folder path from command-line arguments
const folderPath = process.argv[2];

if (!folderPath) {
    console.error("Please provide a folder path as an argument.");
    process.exit(1);
}

processFolder(folderPath)
    .then(() => console.log('All files in folder processed successfully!'))
    .catch(error => console.error('Error:', error));