import pandas as pd
import os


def create_and_process_data():
    """
    Creates a sample CSV, processes it with pandas, and prints the results.
    """
    # Define file path
    csv_file = "sample_events.csv"

    # 1. Create a sample CSV file
    data = {
        "event_id": range(10),
        "timestamp": pd.to_datetime(
            [
                "2023-01-01 10:00:00",
                "2023-01-01 11:00:00",
                "2023-01-02 12:00:00",
                "2023-01-02 13:00:00",
                "2023-01-03 14:00:00",
                "2023-01-03 15:00:00",
                "2023-01-04 16:00:00",
                "2023-01-04 17:00:00",
                "2023-01-05 18:00:00",
                "2023-01-05 19:00:00",
            ]
        ),
        "user_id": [
            "u1",
            "u2",
            "u1",
            "u3",
            "u2",
            "u1",
            "u3",
            "u2",
            "u1",
            "u2",
        ],
        "category": [
            "login",
            "sales",
            "sales",
            "login",
            "logout",
            "sales",
            "sales",
            "login",
            "sales",
            "sales",
        ],
        "value": [None, 100, 150, None, None, 200, 50, None, 300, 75],
    }
    df_initial = pd.DataFrame(data)
    df_initial.to_csv(csv_file, index=False)
    print(f"'{csv_file}' created successfully.")
    print("-" * 30)

    # 2. Read and process the data
    print("Reading and processing the data...")
    df = pd.read_csv(csv_file, parse_dates=["timestamp"])

    print("\nInitial DataFrame:")
    print(df.head())
    print(f"\nShape: {df.shape}")
    print("\nInfo:")
    df.info()

    # 3. Filter for 'sales' category
    df_sales = df[df["category"] == "sales"].copy()
    print("\nDataFrame after filtering for 'sales':")
    print(df_sales)
    print(f"\nShape: {df_sales.shape}")

    # 4. Group by user_id and calculate total sales value
    user_sales = (
        df_sales.groupby("user_id")["value"]
        .sum()
        .reset_index()
        .sort_values(by="value", ascending=False)
    )
    print("\nTotal sales value per user:")
    print(user_sales)

    # Clean up the created file
    os.remove(csv_file)
    print(f"\n'{csv_file}' removed.")
    print("-" * 30)


if __name__ == "__main__":
    create_and_process_data()
