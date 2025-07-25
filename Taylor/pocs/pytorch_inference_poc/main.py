import json
import requests
from PIL import Image, UnidentifiedImageError
from io import BytesIO

import torch
import torchvision.transforms as transforms
from torchvision.models import resnet18, ResNet18_Weights

from fastapi import FastAPI, HTTPException

# --- App Initialization ---
app = FastAPI(
    title="PyTorch Inference PoC",
    description="Serve a pre-trained ResNet18 model for image classification.",
    version="0.1.0",
)

# --- Global Variables & Model Loading ---
model = None
imagenet_class_index = None


@app.on_event("startup")
def load_model():
    """Load the model and class labels on startup."""
    global model, imagenet_class_index

    # Load pre-trained ResNet18 model
    weights = ResNet18_Weights.DEFAULT
    model = resnet18(weights=weights)
    model.eval()

    # Load ImageNet class index
    class_idx_url = weights.meta["categories_json"]
    response = requests.get(class_idx_url)
    response.raise_for_status()  # Ensure the request was successful
    imagenet_class_index = json.loads(response.text)

    print("Model and class labels loaded successfully.")


# --- Preprocessing ---
def transform_image(image_bytes):
    """Apply the necessary transformations to the image."""
    transformations = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
            ),
        ]
    )
    image = Image.open(BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return transformations(image).unsqueeze(0)


# --- API Endpoints ---
@app.get("/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "Model is loaded and ready."}


@app.get("/predict")
def predict(image_url: str):
    """
    Predicts the class of an image from a URL.
    """
    if model is None or imagenet_class_index is None:
        raise HTTPException(
            status_code=503, detail="Model is not loaded. Please wait."
        )

    try:
        # It's good practice to send a user-agent
        headers = {"User-Agent": "FastAPI-Inference-Client/1.0"}
        response = requests.get(image_url, headers=headers)
        response.raise_for_status()
        image_bytes = response.content

        # Preprocess the image
        tensor = transform_image(image_bytes)

        # Make prediction
        with torch.no_grad():
            outputs = model(tensor)
            _, y_hat = outputs.max(1)
            predicted_idx = y_hat.item()

            # Get probabilities and find confidence for the predicted class
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence = probabilities[0][predicted_idx].item()

        # Get the class name
        predicted_class = imagenet_class_index[predicted_idx]

        return {
            "class_index": predicted_idx,
            "class_name": predicted_class,
            "confidence": f"{confidence:.4f}",
        }

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="Cannot identify image file. Is the URL correct?",
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to download image: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )


if __name__ == "__main__":
    import uvicorn

    # This is for direct execution; use `uvicorn main:app --reload` for
    # development
    uvicorn.run(app, host="0.0.0.0", port=8009)
