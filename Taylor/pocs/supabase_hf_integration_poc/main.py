import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def query_huggingface_api(api_url: str, headers: dict, payload: dict) -> dict:
    """Queries the Hugging Face Inference API."""
    response = requests.post(api_url, headers=headers, json=payload)
    response.raise_for_status()  # Will raise an HTTPError for bad responses
    return response.json()


def main():
    """
    Main function to run the Supabase + Hugging Face integration PoC.
    """
    # --- Configuration ---
    # Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # Hugging Face
    hf_api_token = os.getenv("HUGGING_FACE_API_TOKEN")
    hf_model_id = "distilbert-base-uncased-finetuned-sst-2-english"
    hf_api_url = f"https://api-inference.huggingface.co/models/{hf_model_id}"
    hf_headers = {"Authorization": f"Bearer {hf_api_token}"}

    # Check for missing configuration
    if not all([supabase_url, supabase_key, hf_api_token]):
        print("Error: Required environment variables are not set.")
        print(
            "Please create a .env file with SUPABASE_URL, "
            "SUPABASE_SERVICE_ROLE_KEY, and HUGGING_FACE_API_TOKEN."
        )
        return

    # --- Execution ---
    try:
        # 1. Initialize Supabase client
        print("Initializing Supabase client...")
        supabase: Client = create_client(supabase_url, supabase_key)
        print("Supabase client initialized.")

        # 2. Call Hugging Face Inference API
        input_text = "This new framework is amazing!"
        print(
            f"Querying Hugging Face model '{hf_model_id}' with text: "
            f"'{input_text}'"
        )
        hf_payload = {"inputs": input_text}
        prediction_result = query_huggingface_api(
            hf_api_url, hf_headers, hf_payload
        )
        print(f"Received prediction: {prediction_result}")

        # 3. Log prediction to Supabase
        log_data = {
            "input_text": input_text,
            "prediction": prediction_result,
            "model_used": hf_model_id,
        }
        print(f"Logging prediction to Supabase table 'prediction_logs'...")
        data, count = (
            supabase.table("prediction_logs").insert(log_data).execute()
        )

        # The new client returns a tuple (data, count)
        print("Log inserted successfully.")
        print(f"Returned data: {data}")
        print(f"Returned count: {count}")

    except requests.exceptions.RequestException as e:
        print(f"\nError calling Hugging Face API: {e}")
        if e.response is not None:
            print(f"Response Status: {e.response.status_code}")
            print(f"Response Body: {e.response.text}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        # Consider more specific error handling for Supabase client errors if needed


if __name__ == "__main__":
    main()
