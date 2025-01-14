const background = new Audio('audios/friday.mp3')
const click = new Audio('audios/click.mp3')
const block = new Audio('audios/block.mp3')
const next = new Audio('audios/next.mp3')
background.loop = true
background.volume = 0.08
click.volume = 0.5
block.volume = 0.2

// Game prompts - replace preDrawn with your actual image paths
const PROMPTS = [
    {
        initial: "Draw a cat reaching its paw out to the *right* of the screen.",
        full: "Us reaching out together, no matter the distance separating us.",
        preDrawn: "drawings/prompt1.jpg"
    },
    {
        initial: "Draw a picture of your wedding day outfit.",
        full: "Our beautiful wedding day.",
        preDrawn: "drawings/prompt2.jpg"
    },
    {
        initial: "Draw one item to decorate our apartment bedroom with.",
        full: "Our own special place.",
        preDrawn: "drawings/prompt3.jpg"
    },
    {
        initial: "Draw your immediate reaction after getting a kiss.",
        full: "You do have the most kissable of faces after all...",
        preDrawn: "drawings/prompt4.jpg"
    },
    {
        initial: "Draw our future pet that we've just adopted.",
        full: "You do have the most kissable of faces after all...",
        preDrawn: "drawings/prompt5.jpg"
    },
    {
        initial: "What's your ring size by the way? Not like I'm looking for promise rings or anything...",
        full: "🥺",
        preDrawn: "drawings/prompt6.jpg"
    },
    {
        initial: "Finally, draw us finishing a good day and snoozing together.",
        full: "Snore mimimi....",
        preDrawn: "drawings/prompt7.jpg"
    },
];

// Initialize variables
let currentPromptIndex = 0;
let isDrawing = false;
let context = null;
let lastPoint = null;
let drawingHistory = [];
let currentStep = -1;
let currentColor = '#000000';
let currentLineWidth = 5;
let currentTool = 'pen';

// Get DOM elements (at the top where other elements are declared)
const canvas = document.getElementById('drawingCanvas');
const combineCanvas = document.getElementById('combineCanvas');
const colorPicker = document.getElementById('colorPicker');
const lineWidthSlider = document.getElementById('lineWidth');
const eraserButton = document.getElementById('eraserButton');
const undoButton = document.getElementById('undoButton');
const clearButton = document.getElementById('clearButton');
const finishButton = document.getElementById('finishButton');
const nextButton = document.getElementById('nextButton');
const drawingScreen = document.getElementById('drawingScreen');
const revealScreen = document.getElementById('revealScreen');
const currentPromptElement = document.getElementById('currentPrompt');
const fullPromptElement = document.getElementById('fullPrompt');
const combinedImage = document.getElementById('combinedImage');
const titleScreen = document.getElementById('titleScreen');
const startButton = document.getElementById('startButton');
const confirmDialog = document.getElementById('confirmDialog');
const confirmFinishButton = document.getElementById('confirmFinish');
const cancelFinishButton = document.getElementById('cancelFinish');

// Initialize color presets
const colorPresets = ['#000000', '#FF4444', '#44AAFF', '#44FF44', '#FFAA44', '#AA44FF', '#FF44AA'];
const colorPresetsContainer = document.querySelector('.color-presets');

colorPresets.forEach(color => {
    const button = document.createElement('button');
    button.className = 'color-preset';
    button.style.backgroundColor = color;
    button.onclick = () => setColor(color);
    colorPresetsContainer.appendChild(button);
});

// Initialize canvas
function initializeCanvas() {
    canvas.width = 800;
    canvas.height = 800;
    context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    clearCanvas();
}

// Save canvas state to history
function saveToHistory() {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    drawingHistory = [...drawingHistory.slice(0, currentStep + 1), imageData];
    currentStep = drawingHistory.length - 1;
}

// Canvas operations
function clearCanvas() {
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
}

function handleUndo() {
    if (currentStep > 0) {
        currentStep--;
        context.putImageData(drawingHistory[currentStep], 0, 0);
    }
}

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let x, y;
    
    if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        x = (touch.clientX - rect.left) * scaleX;
        y = (touch.clientY - rect.top) * scaleY;
    } else {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
    }
    
    // Ensure coordinates are within canvas bounds
    x = Math.max(0, Math.min(x, canvas.width));
    y = Math.max(0, Math.min(y, canvas.height));
    
    return { x, y };
}

function startDrawing(e) {
    isDrawing = true;
    lastPoint = getCoordinates(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    const newPoint = getCoordinates(e);
    
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(newPoint.x, newPoint.y);
    context.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
    context.lineWidth = currentLineWidth;
    context.stroke();
    
    lastPoint = newPoint;
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveToHistory();
    }
}

// Handle tool changes
function setColor(color) {
    currentColor = color;
    colorPicker.value = color;
    currentTool = 'pen';
    eraserButton.classList.remove('active');
}

function toggleEraser() {
    currentTool = currentTool === 'eraser' ? 'pen' : 'eraser';
    eraserButton.classList.toggle('active');
}

// Combine images for reveal
async function combineImages() {
    const ctx = combineCanvas.getContext('2d');
    
    // Set canvas size for side-by-side images
    combineCanvas.width = 1600; // 800 * 2
    combineCanvas.height = 800;
    
    // Clear with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, combineCanvas.width, combineCanvas.height);

    try {
        // Create a promise-based image loader
        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        // Load partner's pre-drawn image
        const partnerImg = await loadImage(PROMPTS[currentPromptIndex].preDrawn);
        
        // Draw current canvas content and partner's image side by side
        ctx.drawImage(canvas, 0, 0);
        ctx.drawImage(partnerImg, 800, 0);
        
        // Update the combined image
        combinedImage.src = combineCanvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error combining images:', error);
    }
}

function showThankYouScreen() {
    // Create a full-screen thank you container
    const thankYouScreen = document.createElement('div');
    thankYouScreen.style.position = 'fixed';
    thankYouScreen.style.top = '0';
    thankYouScreen.style.left = '0';
    thankYouScreen.style.width = '100%';
    thankYouScreen.style.height = '100%';
    thankYouScreen.style.backgroundColor = 'black';
    thankYouScreen.style.color = 'white';
    thankYouScreen.style.display = 'flex';
    thankYouScreen.style.alignItems = 'center';
    thankYouScreen.style.justifyContent = 'center';
    thankYouScreen.style.textAlign = 'center';
    thankYouScreen.style.fontFamily = 'Arial, sans-serif';
    thankYouScreen.style.zIndex = '1000';

    thankYouScreen.innerHTML = `
        <div>
            <h1 style="font-size: 2.5rem; margin-bottom: 20px;">thank u for drawing love</h1>
            <p style="font-size: 1.2rem; color: #d694d1;">i hope this was silly and fun i love you</p>
        </div>
    `;

    // Remove other screens
    document.querySelector('#revealScreen').style.display = 'none';
    document.body.appendChild(thankYouScreen);
}

// Screen transitions
function showRevealScreen() {
    combineImages().then(() => {
        drawingScreen.style.display = 'none';
        revealScreen.classList.add('active');
        
        // Slightly delay adding the show class for the entrance animation
        setTimeout(() => {
            document.querySelector('.reveal-content').classList.add('show');
        }, 100);
        
        fullPromptElement.textContent = PROMPTS[currentPromptIndex].full;
    });
}

function showNextPrompt() {
    if (currentPromptIndex < PROMPTS.length - 1) {
        // Start fade out
        next.play()
        document.querySelector('.reveal-content').classList.remove('show');
        
        setTimeout(() => {
            currentPromptIndex++;
            revealScreen.classList.remove('active');
            drawingScreen.style.display = 'block';
            currentPromptElement.textContent = PROMPTS[currentPromptIndex].initial;
            clearCanvas();
            drawingHistory = [];
            currentStep = -1;
            combinedImage.src = '';
            const ctx = combineCanvas.getContext('2d');
            ctx.clearRect(0, 0, combineCanvas.width, combineCanvas.height);
        }, 600);
    } else {
        // Show thank you screen when all prompts are completed
        showThankYouScreen();
    }
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
});
canvas.addEventListener('touchend', stopDrawing);

colorPicker.addEventListener('input', (e) => setColor(e.target.value));
lineWidthSlider.addEventListener('input', (e) => currentLineWidth = parseInt(e.target.value));
eraserButton.addEventListener('click', toggleEraser);
undoButton.addEventListener('click', handleUndo);
clearButton.addEventListener('click', clearCanvas);
// REMOVED finishButton event listener from here
nextButton.addEventListener('click', showNextPrompt);



// Remove the duplicate declarations
// Start game when start button is clicked
startButton.addEventListener('click', () => {
    background.play()
    next.play()
    titleScreen.style.display = 'none';
    drawingScreen.style.display = 'block';
    initializeCanvas();
    currentPromptElement.textContent = PROMPTS[currentPromptIndex].initial;
});

// Show confirmation dialog when finish button is clicked
finishButton.addEventListener('click', (e) => {
    click.play()
    e.preventDefault();
    confirmDialog.style.display = 'flex';
});

// Handle confirmation dialog buttons
confirmFinishButton.addEventListener('click', () => {
    click.play()
    confirmDialog.style.display = 'none';
    showRevealScreen();
});

cancelFinishButton.addEventListener('click', () => {
    block.play()
    confirmDialog.style.display = 'none';
});

// Initialize with title screen visible and drawing screen hidden
drawingScreen.style.display = 'none';
titleScreen.style.display = 'block';