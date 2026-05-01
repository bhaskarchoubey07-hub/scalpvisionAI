import os
import pandas as pd
import glob
import random

def standardize_columns(df):
    """Standardizes column names to lowercase and maps common variations."""
    df.columns = df.columns.str.lower().str.strip()
    
    # Map common column names
    col_map = {
        'timestamp': 'date',
        'adj close': 'close',
        'vwap': 'close' # Fallback if close isn't there
    }
    df = df.rename(columns=col_map)
    
    required_cols = ['date', 'open', 'high', 'low', 'close', 'volume']
    
    # Check if we have the minimum required columns
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        return None
        
    # Remove duplicate columns if any exist
    df = df.loc[:, ~df.columns.duplicated()]
        
    # Return only required columns
    return df[required_cols]

def merge_datasets(archive_paths, output_file):
    all_data = []
    
    print("Starting data merge process...")
    for path in archive_paths:
        if not os.path.exists(path):
            print(f"Path does not exist: {path}")
            continue
            
        print(f"\nProcessing archive: {path}")
        
        # Find all CSVs in the path (recursively)
        csv_files = glob.glob(os.path.join(path, '**', '*.csv'), recursive=True)
        print(f"Found {len(csv_files)} CSV files in {path}.")
        
        # Limit the number of individual small files we process to avoid memory/time issues
        # We'll prioritize known aggregated files or just take a sample
        if len(csv_files) > 100:
            print(f"Limiting to 100 sample files from {path} for speed...")
            # We want to make sure we get popular ones if they exist, but random is fine too
            csv_files = random.sample(csv_files, 100)
        
        for idx, file in enumerate(csv_files):
            filename = os.path.basename(file).lower()
            
            # Skip metadata and sentiment files
            if 'meta' in filename or 'sentiment' in filename or 'text' in filename:
                continue
                
            try:
                # Read just the header first to see if it's relevant
                header = pd.read_csv(file, nrows=0)
                std_df_test = standardize_columns(header.copy())
                
                if std_df_test is not None:
                    df = pd.read_csv(file)
                    df = standardize_columns(df)
                    
                    if df is not None and not df.empty:
                        all_data.append(df)
                        if idx % 10 == 0:
                            print(f"  -> Processed {idx}/{len(csv_files)} files. Latest: {filename} ({len(df)} rows)")
            except Exception as e:
                pass # Skip files that fail to parse
                
    if not all_data:
        print("No valid price data found in the provided archives.")
        return
        
    print(f"\nConcatenating {len(all_data)} datasets...")
    final_df = pd.concat(all_data, ignore_index=True)
    
    print("Cleaning data...")
    # Convert date column to datetime
    final_df['date'] = pd.to_datetime(final_df['date'], errors='coerce')
    
    # Drop rows with invalid dates or NaNs in critical columns
    final_df = final_df.dropna(subset=['date', 'close', 'open'])
    
    # Sort by date
    final_df = final_df.sort_values('date').reset_index(drop=True)
    
    # Remove duplicates
    final_df = final_df.drop_duplicates()
    
    print(f"Saving {len(final_df)} rows to {output_file}...")
    final_df.to_csv(output_file, index=False)
    print("✅ Merge complete!")

if __name__ == "__main__":
    archive_paths = [
        r"C:\Users\bhask\Downloads\archive (1)",
        r"C:\Users\bhask\Downloads\archive (2)",
        r"C:\Users\bhask\Downloads\archive (3)",
        r"C:\Users\bhask\Downloads\archive (4)"
    ]
    
    output_filepath = "../cleaned_stock_data.csv"
    if not os.path.exists("../ai_engine"):
        output_filepath = "cleaned_stock_data.csv"
        
    merge_datasets(archive_paths, output_filepath)
