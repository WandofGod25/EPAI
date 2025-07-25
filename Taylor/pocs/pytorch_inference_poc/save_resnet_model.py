import torch
import torchvision.models as models
import os

# Define the directory and path for the model
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILENAME = "resnet18_pretrained.pth"
MODEL_PATH = os.path.join(MODEL_DIR, MODEL_FILENAME)


def save_model():
    """
    Downloads the ResNet18 pre-trained weights and saves the state dictionary.
    """
    print("Downloading pre-trained ResNet18 model weights...")
    # Using the recommended 'weights' parameter for modern torchvision
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    print("Model downloaded.")

    # Save the model's state dictionary
    try:
        torch.save(model.state_dict(), MODEL_PATH)
        print(f"Model state dictionary saved successfully to: {MODEL_PATH}")
    except Exception as e:
        print(f"Error saving model: {e}")


if __name__ == "__main__":
    if os.path.exists(MODEL_PATH):
        print(f"Model file already exists at: {MODEL_PATH}")
        overwrite = (
            input("Do you want to overwrite it? (y/n): ").strip().lower()
        )
        if overwrite == "y":
            save_model()
        else:
            print("Operation cancelled.")
    else:
        save_model()
