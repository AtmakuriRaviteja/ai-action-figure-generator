document.addEventListener('DOMContentLoaded', () => {
    // State Elements
    const uploadState = document.getElementById('upload-state');
    const processingState = document.getElementById('processing-state');
    const resultState = document.getElementById('result-state');

    // Upload Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const chooseImageBtn = document.getElementById('choose-image-btn');

    // Processing Elements
    const previewImage = document.getElementById('preview-image');
    const progressBar = document.getElementById('progress-bar');
    const processingStep = document.getElementById('processing-step');

    // Personalization Elements
    const heroNameInput = document.getElementById('hero-name');
    const heroProfessionInput = document.getElementById('hero-profession');
    const heroAccessoriesInput = document.getElementById('hero-accessories');
    const generateBtn = document.getElementById('generate-btn');

    // Result Elements
    const resultFigureImg = document.getElementById('result-figure-img');
    const toyBoxCard = document.getElementById('toy-box-card');
    const flipBtn = document.getElementById('flip-btn');
    const resetBtn = document.getElementById('reset-btn');

    // --- State Management ---
    function showState(stateElement) {
        uploadState.classList.remove('active');
        processingState.classList.remove('active');
        resultState.classList.remove('active');
        stateElement.classList.add('active');
    }

    // --- Upload Logic ---
    chooseImageBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileValidation);

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileValidation();
        }
    });

    function handleFileValidation() {
        const file = fileInput.files[0];
        const previewImg = document.getElementById('upload-preview-img');
        const iconWrapper = document.getElementById('upload-icon-wrapper');

        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file before generating.');
            if (previewImg && iconWrapper) {
                previewImg.style.display = 'none';
                iconWrapper.style.display = 'flex';
                previewImg.src = '';
            }
            return false;
        }

        if (previewImg && iconWrapper) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                iconWrapper.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }

        return true;
    }

    generateBtn.addEventListener('click', () => {
        if (handleFileValidation()) {
            const file = fileInput.files[0];
            const name = heroNameInput.value.trim() || 'Custom Hero';
            const profession = heroProfessionInput.value.trim() || 'Hero';
            const accessories = heroAccessoriesInput.value.trim() || 'epic gear';
            const style = document.getElementById('style').value; // Get selected style
            const gender = document.getElementById('hero-gender').value;

            startProcessing(file, name, profession, accessories, style, gender);
        }
    });

    // --- Processing Logic ---
    async function startProcessing(file, name, profession, accessories, style, gender) {
        showState(processingState);

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
        };
        reader.readAsDataURL(file);

        let progress = 0;
        progressBar.style.width = '0%';

        const steps = [
            "Analyzing facial features...",
            "Mapping 3D topology...",
            "Applying plastic textures...",
            "Adding articulation joints...",
            "Packaging figure...",
            "Finalizing..."
        ];

        let stepIndex = 0;
        processingStep.innerText = steps[stepIndex];

        // Start a faux progress indicator that reaches 90%
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 5 + 1;
                progressBar.style.width = `${progress}%`;

                const expectedStep = Math.floor((progress / 100) * steps.length);
                if (expectedStep > stepIndex && expectedStep < steps.length) {
                    stepIndex = expectedStep;
                    processingStep.innerText = steps[stepIndex];
                }
            }
        }, 800); // 800ms makes it slower and more realistic for local generation

        try {
            // Call actual backend API
            const formData = new FormData();
            formData.append('image', file);
            formData.append('name', name);
            formData.append('profession', profession);
            formData.append('accessories', accessories);
            formData.append("model", style);
            formData.append("gender", gender);

            const response = await fetch('/generate', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            processingStep.innerText = "Done!";

            if (data.image) {
                setTimeout(() => {
                    const imgSrc = "data:image/png;base64," + data.image;
                    showResult(imgSrc);
                }, 500);
            } else {
                alert("Generation failed: " + (data.error || "Unknown error"));
                showState(uploadState);
            }

        } catch (error) {
            console.error("AI Generation Error:", error);
            clearInterval(progressInterval);
            alert("Failed to connect to AI server. Make sure the backend is running.");
            showState(uploadState);
        }
    }

    // --- Result Logic ---
    function showResult(imageUrl) {
        resultFigureImg.src = imageUrl;
        showState(resultState);
        toyBoxCard.classList.remove('flipped');
    }

    flipBtn.addEventListener('click', () => {
        toyBoxCard.classList.toggle('flipped');
        if (toyBoxCard.classList.contains('flipped')) {
            flipBtn.innerText = "View Front";
        } else {
            flipBtn.innerText = "Inspect Figure";
        }
    });

    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        heroNameInput.value = '';
        heroProfessionInput.value = '';
        heroAccessoriesInput.value = '';
        const previewImg = document.getElementById('upload-preview-img');
        const iconWrapper = document.getElementById('upload-icon-wrapper');
        if (previewImg && iconWrapper) {
            previewImg.style.display = 'none';
            iconWrapper.style.display = 'flex';
            previewImg.src = '';
        }
        showState(uploadState);
    });

    // --- Viral Sharing Logic ---
    const downloadBtn = document.getElementById('download-btn');

    downloadBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(resultFigureImg.src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Provide a catchy name for the downloaded file
            a.download = 'my_ai_action_figure.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download image", err);
            // Fallback for simple direct link download if fetch blobbing fails
            const a = document.createElement('a');
            a.href = resultFigureImg.src;
            a.download = 'my_ai_action_figure.png';
            a.target = '_blank';
            a.click();
        }
    });

    // Create Share Buttons dynamically in the action panel
    const actionPanel = document.querySelector('.action-panel');

    const shareContainer = document.createElement('div');
    shareContainer.style.marginTop = '1.5rem';
    shareContainer.innerHTML = `
        <p style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Share your figure:</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="share-ig" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: white; padding: 0.5rem 1rem; font-size: 0.9rem;">Instagram</button>
            <button id="share-tt" style="background: #000; color: white; border: 1px solid #25F4EE; padding: 0.5rem 1rem; font-size: 0.9rem;">TikTok</button>
            <button id="share-wa" style="background: #25D366; color: white; padding: 0.5rem 1rem; font-size: 0.9rem;">WhatsApp</button>
        </div>
        <button id="native-share" class="secondary-btn mt-3" style="width: 100%; display: none;">Native Share Options</button>
    `;
    actionPanel.appendChild(shareContainer);

    const shareText = "I turned myself into an action figure using AI 🤖 Check it out!";

    document.getElementById('share-wa').addEventListener('click', () => {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    });

    // Generic fallback intent for platforms that don't have simple web-share text URLs (IG/TikTok usually require app intents or manual flow)
    document.getElementById('share-ig').addEventListener('click', () => {
        copyAndAlert("Instagram");
    });

    document.getElementById('share-tt').addEventListener('click', () => {
        copyAndAlert("TikTok");
    });

    function copyAndAlert(platform) {
        navigator.clipboard.writeText(shareText).then(() => {
            alert(`For ${platform}: The caption "${shareText}" has been copied to your clipboard! Download the image above and paste the text into ${platform}.`);
        });
    }

    // Use Web Share API if supported (mobile devices natively support this best)
    if (navigator.share) {
        const nativeShareBtn = document.getElementById('native-share');
        nativeShareBtn.style.display = 'block';
        nativeShareBtn.addEventListener('click', async () => {
            try {
                // If we want to share the actual image file natively we need to fetch it as a File object
                const response = await fetch(resultFigureImg.src);
                const blob = await response.blob();
                const file = new File([blob], "action_figure.png", { type: blob.type });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'My AI Action Figure',
                        text: shareText,
                        files: [file]
                    });
                } else {
                    await navigator.share({
                        title: 'My AI Action Figure',
                        text: shareText
                    });
                }
            } catch (err) {
                console.log('Error sharing natively', err);
            }
        });
    }
});
