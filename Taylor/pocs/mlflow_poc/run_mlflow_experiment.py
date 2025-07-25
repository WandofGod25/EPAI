import mlflow
import mlflow.sklearn
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import numpy as np
import uuid

MLFLOW_TRACKING_URI = "http://127.0.0.1:5001"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

# Generate a unique model name for each run to avoid conflicts
model_name = f"poc-lr-model-{uuid.uuid4().hex[:8]}"


def run_experiment():
    """
    Trains a simple model, logs it to MLflow, and registers it.
    """
    mlflow.set_experiment("PoC_Sklearn_Experiment")

    # 1. Prepare dummy data
    X = np.random.rand(100, 5)
    y = np.random.randint(0, 2, 100)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )

    with mlflow.start_run() as run:
        run_id = run.info.run_id
        print(f"MLflow Run ID: {run_id}")

        # 2. Train a simple model
        C = 0.5
        model = LogisticRegression(C=C, random_state=42)
        model.fit(X_train, y_train)

        # 3. Evaluate the model
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        # 4. Log parameters, metrics, and artifacts
        print(f"Logging parameters: C={C}")
        mlflow.log_param("C", C)
        mlflow.log_param("model_type", "LogisticRegression")

        print(f"Logging metrics: accuracy={accuracy:.4f}")
        mlflow.log_metric("accuracy", accuracy)

        # Log an artifact (e.g., a simple text file)
        with open("experiment_notes.txt", "w") as f:
            f.write("This is a test run for the MLflow PoC.")
        mlflow.log_artifact(
            "experiment_notes.txt", artifact_path="run_artifacts"
        )

        # 5. Log the model
        print("Logging the scikit-learn model...")
        input_example = X_train[:5, :]
        mlflow.sklearn.log_model(
            sk_model=model,
            artifact_path="sklearn-model",
            registered_model_name=model_name,
            input_example=input_example,
        )

        print(f"Model '{model_name}' logged and registered successfully.")
        print(
            f"View run at: {MLFLOW_TRACKING_URI}/#/experiments/"
            f"{run.info.experiment_id}/runs/{run_id}"
        )


if __name__ == "__main__":
    run_experiment()
